"""
Ingest Arrests and Prosecutions Excel data into Supabase.

Source: 'Arrests and Prosecutions List.xlsx'
  - Sheet 'Sheet1' → dggi_arrest_records (when col P has value)
  - Sheet 'Sheet1' → dggi_prosecution_arrest_records (when cols U/V have values)

Insert strategy: ALWAYS INSERT (no upsert). Re-running creates duplicates.

Usage:
    python3 scripts/ingest_arrest_prosecution_data.py [/path/to/file.xlsx] [--dry-run]
"""

import csv
import hashlib
import os
import sys
from datetime import date, datetime

import openpyxl
from supabase import create_client

# ─── Constants ────────────────────────────────────────────────────────────────

SUPABASE_URL = "https://zrkvvedwycdcjjheewef.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3Z2ZWR3eWNkY2pqaGVld2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzAxNjg1NCwiZXhwIjoyMDE4NTkyODU0fQ.ZYgzzv6E--3v2un2uN0jXwHnBvCf0EjPJlGoCQwiqKE"

WORKSPACE_OWNER_EMAIL = "ajinkya.k1@gov.in"

DEFAULT_EXCEL_PATH = os.path.join(
    os.path.expanduser("~"),
    "Downloads",
    "Arrests and Prosecutions List.xlsx",
)

SKIPPED_CSV = os.path.join(
    os.path.dirname(__file__),
    "ingest_arrest_prosecution_skipped.csv"
)

# Column indices (0-based)
COL_GROUP = 1
COL_SIO = 2
COL_FY = 4
COL_FILE_NO = 5
COL_TAXPAYER = 6
COL_GSTIN = 8
COL_AMOUNT_LAKHS = 9
COL_ARRESTED_NAME = 10
COL_DESIGNATION = 11
COL_AGE = 12
COL_DATE_OF_ARREST = 15
COL_ROLE = 16
COL_OFFENCE_132_1 = 17
COL_PERSON_132_2 = 18
COL_PROSECUTION_SANCTION_NO = 19
COL_PROSECUTION_SANCTION_DATE = 20
COL_NUM_PROSECUTED = 21
COL_DATE_FILING = 22
COL_CURRENT_STATUS = 27
COL_BAIL_GRANTED = 28
COL_PROSECUTION_LAUNCHED = 30
COL_DATE_LAUNCHING = 31
COL_REASONS_NOT_FILED = 32


# ─── Helper Functions ─────────────────────────────────────────────────────────

def current_fy() -> str:
    """Returns FY in YY-YY format (e.g., '26-27')."""
    now = datetime.now()
    yr = now.year
    start = yr if now.month >= 4 else yr - 1
    return f"{str(start)[2:]}-{str(start + 1)[2:]}"


def generate_arrest_record_id(sb, workspace_id: str) -> str:
    """Generate sequential ARR/###/YY-YY record ID."""
    res = (
        sb.table("dggi_arrest_records")
        .select("*", count="exact", head=True)
        .eq("workspace_id", workspace_id)
        .execute()
    )
    count = res.count or 0
    seq = str(count + 1).zfill(3)
    return f"ARR/{seq}/{current_fy()}"


def generate_prosecution_record_id(sb, workspace_id: str) -> str:
    """Generate sequential PRA/###/YY-YY record ID."""
    res = (
        sb.table("dggi_prosecution_arrest_records")
        .select("*", count="exact", head=True)
        .eq("workspace_id", workspace_id)
        .execute()
    )
    count = res.count or 0
    seq = str(count + 1).zfill(3)
    return f"PRA/{seq}/{current_fy()}"


def parse_date(val) -> str | None:
    """Parse date from Excel cell (datetime object or string)."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.date().isoformat()
    if isinstance(val, date):
        return val.isoformat()
    s = str(val).strip()
    if not s or s.upper() == "NA":
        return None
    # Try multiple formats
    for fmt in ("%d.%m.%Y", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            pass
    return None


def normalize_group(val) -> str | None:
    """Normalize group: 'C' → 'Group C', leave full names as-is."""
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return None
    if s.startswith("Group "):
        return s
    if len(s) == 1 and s.upper() in "ABCDEF":
        return f"Group {s.upper()}"
    # Return as-is for full names like "Pune Regional Unit"
    return s


def clean(val) -> str | None:
    """Clean text value."""
    if val is None:
        return None
    s = str(val).strip()
    if s == "-" or s.upper() == "NA" or s == "":
        return None
    return s


def lakhs_to_crores(val) -> str | None:
    """Convert amount in lakhs to crores (divide by 100)."""
    if val is None:
        return None
    try:
        lakhs = float(val)
        if lakhs == 0:
            return None
        crores = lakhs / 100
        return str(round(crores, 2))
    except (ValueError, TypeError):
        return None


def normalize_bail_status(val) -> str:
    """Normalize bail status to 'Bail Given' or 'Bail Not Given'."""
    if val is None:
        return "Bail Not Given"
    s = str(val).strip().lower()
    if s in ("yes", "yEs"):
        return "Bail Given"
    if "granted" in s or "bail" in s:
        return "Bail Given"
    if s in ("no", ""):
        return "Bail Not Given"
    return "Bail Given"


def normalize_prosecution_status(val) -> str:
    """Normalize prosecution complaint status."""
    if val is None:
        return "Pending Sanction"
    s = str(val).strip().lower()
    if s in ("yes", "yEs"):
        return "Filed"
    if s in ("no", ""):
        return "Not Filed"
    if "pending" in s or "process" in s or s == "na":
        return "Pending Sanction"
    return "Pending Sanction"


def derive_person_status(bail_status: str, current_status: str) -> str:
    """Derive status_of_person from bail and current status text."""
    if current_status:
        lower = current_status.lower()
        if "deceased" in lower or "demised" in lower or "died" in lower:
            return "Deceased"
        if "absconding" in lower:
            return "Absconding"
        if "jail" in lower or "custody" in lower:
            return "In Custody"

    if bail_status == "Bail Given":
        return "On Bail"
    return "In Custody"


def combine_text_fields(*values) -> str | None:
    """Combine multiple text fields into one, separated by ' | '."""
    parts = [clean(v) for v in values if clean(v)]
    return " | ".join(parts) if parts else None


def generate_batch_id(party_name: str) -> str | None:
    """Generate batch ID from party/taxpayer name for UI grouping."""
    if not party_name:
        return None
    # Normalize: strip whitespace, lowercase for consistent hashing
    key = party_name.strip().lower()
    hash_val = hashlib.sha256(key.encode()).hexdigest()[:8]
    return f"BATCH-{hash_val}"


def lookup_linked_case_id(sb, workspace_id: str, file_no: str) -> str | None:
    """Lookup record_id from dggi_records by file_no."""
    if not file_no:
        return None
    res = (
        sb.table("dggi_records")
        .select("record_id")
        .eq("workspace_id", workspace_id)
        .eq("file_no", file_no)
        .limit(1)
        .execute()
    )
    if res.data:
        return res.data[0]["record_id"]
    return None


# ─── Processor Functions ──────────────────────────────────────────────────────

def process_arrest_row(
    row: tuple,
    sb,
    workspace_id: str,
    created_by: str | None,
    skipped: list,
    dry_run: bool,
) -> tuple[str, str | None]:
    """
    Process one Excel row and create arrest record if date_of_arrest present.

    Returns:
        ("inserted", arrest_uuid) - arrest created successfully
        ("skipped", None) - no arrest data or error
    """
    date_of_arrest = parse_date(row[COL_DATE_OF_ARREST])
    if not date_of_arrest:
        return ("skipped", None)

    party_name = clean(row[COL_TAXPAYER])
    if not party_name:
        skipped.append({
            "sheet": "Arrest",
            "arrested_name": clean(row[COL_ARRESTED_NAME]) or "?",
            "reason": "Missing party_name (taxpayer)",
        })
        return ("skipped", None)

    # Build payload
    file_no = clean(row[COL_FILE_NO])
    linked_case = lookup_linked_case_id(sb, workspace_id, file_no)
    # Generate batch_id from party name for UI grouping
    batch_id = generate_batch_id(party_name)

    gstin = clean(row[COL_GSTIN])
    if gstin == "-":
        gstin = None

    role_evidence = combine_text_fields(
        row[COL_ROLE],
        row[COL_OFFENCE_132_1],
        row[COL_PERSON_132_2],
    )

    # Check if prosecution data exists in this row
    has_prosecution = any([
        clean(row[COL_PROSECUTION_SANCTION_NO]),
        clean(row[COL_PROSECUTION_SANCTION_DATE]),
        clean(row[COL_NUM_PROSECUTED]),
    ])

    payload = {
        "workspace_id": workspace_id,
        "record_id": generate_arrest_record_id(sb, workspace_id),
        "arrest_batch_id": batch_id,
        "linked_case_id": linked_case,
        "date_of_arrest": date_of_arrest,
        "financial_year": clean(row[COL_FY]),
        "party_name": party_name,
        "unit_gstin": gstin or "",  # NOT NULL DEFAULT ''
        "amount_crore": lakhs_to_crores(row[COL_AMOUNT_LAKHS]),
        "arrested_name": clean(row[COL_ARRESTED_NAME]),
        "arrested_designation": clean(row[COL_DESIGNATION]),
        "arrested_age": clean(row[COL_AGE]),
        "role_evidence": role_evidence,
        "prosecution_filed": "Yes" if has_prosecution else "",
        "group": normalize_group(row[COL_GROUP]),
        "created_by": created_by,
        "created_by_name": clean(row[COL_SIO]),
    }

    # Remove None values (except required fields)
    payload = {k: v for k, v in payload.items() if v is not None or k in ("unit_gstin", "prosecution_filed")}

    try:
        if not dry_run:
            res = sb.table("dggi_arrest_records").insert(payload).execute()
            arrest_id = res.data[0]["id"]
            return ("inserted", arrest_id)
        else:
            return ("inserted", "dry-run-uuid")
    except Exception as e:
        skipped.append({
            "sheet": "Arrest",
            "arrested_name": payload.get("arrested_name", ""),
            "reason": str(e),
        })
        return ("skipped", None)


def process_prosecution_row(
    row: tuple,
    sb,
    workspace_id: str,
    arrest_id: str | None,
    created_by: str | None,
    skipped: list,
    dry_run: bool,
) -> str:
    """
    Process one Excel row and create prosecution record if prosecution data present.

    Returns: "inserted" | "skipped"
    """
    # Check if prosecution data exists
    has_prosecution = any([
        clean(row[COL_PROSECUTION_SANCTION_NO]),
        clean(row[COL_PROSECUTION_SANCTION_DATE]),
        clean(row[COL_NUM_PROSECUTED]),
    ])

    if not has_prosecution:
        return "skipped"

    file_no = clean(row[COL_FILE_NO])
    linked_case = lookup_linked_case_id(sb, workspace_id, file_no)

    bail_status = normalize_bail_status(row[COL_BAIL_GRANTED])
    current_status = clean(row[COL_CURRENT_STATUS])
    person_status = derive_person_status(bail_status, current_status or "")

    modus = combine_text_fields(
        row[COL_ROLE],
        row[COL_OFFENCE_132_1],
        row[COL_PERSON_132_2],
    )

    pros_status = normalize_prosecution_status(row[COL_PROSECUTION_LAUNCHED])

    # Date of filing: use col 22 (DATE OF FILING) or fallback to col 31
    date_filing = parse_date(row[COL_DATE_FILING]) or parse_date(row[COL_DATE_LAUNCHING])

    payload = {
        "workspace_id": workspace_id,
        "record_id": generate_prosecution_record_id(sb, workspace_id),
        "linked_arrest_id": arrest_id,
        "linked_case_id": linked_case,
        "arrested_person_name": clean(row[COL_ARRESTED_NAME]),
        "age": clean(row[COL_AGE]),
        "date_of_arrest": parse_date(row[COL_DATE_OF_ARREST]),
        "bail_status": bail_status,
        "status_of_person": person_status,
        "amount_evaded_crore": lakhs_to_crores(row[COL_AMOUNT_LAKHS]),
        "entity_name": clean(row[COL_TAXPAYER]),
        "gstin": clean(row[COL_GSTIN]),
        "brief_modus_operandi": modus,
        "prosecution_complaint_status": pros_status,
        "date_of_filing": date_filing,
        "reasons_not_filed": clean(row[COL_REASONS_NOT_FILED]),
        "group": normalize_group(row[COL_GROUP]),
        "created_by": created_by,
        "created_by_name": clean(row[COL_SIO]),
    }

    payload = {k: v for k, v in payload.items() if v is not None}

    try:
        if not dry_run:
            sb.table("dggi_prosecution_arrest_records").insert(payload).execute()
        return "inserted"
    except Exception as e:
        skipped.append({
            "sheet": "Prosecution",
            "arrested_name": payload.get("arrested_person_name", ""),
            "reason": str(e),
        })
        return "skipped"


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    positional = [a for a in args if not a.startswith("--")]
    excel_path = positional[0] if positional else DEFAULT_EXCEL_PATH

    if not os.path.exists(excel_path):
        raise SystemExit(f"Excel file not found: {excel_path}")

    if dry_run:
        print("*** DRY RUN — no changes will be written ***\n")

    print(f"Loading: {excel_path}")
    wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
    ws = wb["Sheet1"]

    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    # Get workspace and user
    res = sb.table("votum_users").select("workspace_id, id").eq("email", WORKSPACE_OWNER_EMAIL).limit(1).execute()
    if not res.data:
        raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")

    workspace_id = res.data[0]["workspace_id"]
    created_by = res.data[0]["id"]

    print(f"Workspace: {workspace_id}")
    print(f"User: {created_by}\n")

    skipped = []
    arrest_inserted = arrest_skipped = 0
    pros_inserted = pros_skipped = 0

    rows = list(ws.iter_rows(values_only=True))

    for row_idx, row in enumerate(rows[2:], start=3):  # Skip header rows
        # Process arrest
        arrest_status, arrest_id = process_arrest_row(
            row, sb, workspace_id, created_by, skipped, dry_run
        )
        if arrest_status == "inserted":
            arrest_inserted += 1
        else:
            arrest_skipped += 1

        # Process prosecution (only if arrest was created or dry-run)
        if arrest_id or dry_run:
            pros_status = process_prosecution_row(
                row, sb, workspace_id, arrest_id, created_by, skipped, dry_run
            )
            if pros_status == "inserted":
                pros_inserted += 1
            elif pros_status == "skipped":
                pros_skipped += 1

    # Print summary
    print(f"\n{'=' * 60}")
    print(f"[Arrests]      {'Would insert' if dry_run else 'Inserted'}: {arrest_inserted} | Skipped: {arrest_skipped}")
    print(f"[Prosecutions] {'Would insert' if dry_run else 'Inserted'}: {pros_inserted} | Skipped: {pros_skipped}")
    print(f"{'=' * 60}")

    # Write skipped rows
    if skipped:
        if not dry_run:
            with open(SKIPPED_CSV, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=list(skipped[0].keys()))
                writer.writeheader()
                writer.writerows(skipped)
            print(f"\nSkipped {len(skipped)} rows — see {SKIPPED_CSV}")
        else:
            print(f"\nWould skip {len(skipped)} rows.")
    else:
        print("\nNo rows skipped.")

    print("\nDry run complete — no data written." if dry_run else "\nDone.")


if __name__ == "__main__":
    main()

"""
Ingest Provisional Attachment Excel data into Supabase.

Source: 'MZU_ PROVISIONAL ATTACHMENT (4).xlsx'
  - Sheet 'Sheet1', rows 1-5 are headers/sub-headers, data starts row 6
  - Each row → one dggi_provisional_attachment_records insert

Insert strategy: ALWAYS INSERT (no upsert). Re-running creates duplicates.

Usage:
    python3 scripts/ingest_provisional_attachment_data.py [/path/to/file.xlsx] [--dry-run]
"""

import csv
import hashlib
import os
import sys
from datetime import date, datetime

import openpyxl
from dotenv import load_dotenv
from supabase import create_client

# ─── Constants ────────────────────────────────────────────────────────────────

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

WORKSPACE_OWNER_EMAIL = "ajinkya.k1@gov.in"

DEFAULT_EXCEL_PATH = os.path.join(
    os.path.expanduser("~"),
    "Downloads",
    "MZU_ PROVISIONAL ATTACHMENT (4).xlsx",
)

SKIPPED_CSV = os.path.join(
    os.path.dirname(__file__),
    "ingest_provisional_attachment_skipped.csv",
)

# Column indices (0-based)
COL_IR_NO = 2           # Incident Report No.
COL_TYPOLOGY = 3        # Typology of the case
COL_BANK_ACCT = 8       # Bank Account No.
COL_BANK_NAME = 9       # Bank Name
COL_BANK_IFSC = 10      # Branch / IFSC
COL_DATE_ATTACHMENT = 11  # Date of Attachment
COL_VALUE_IMMOVABLE = 12  # Value of Immovable Property
COL_VALUE_MOVABLE = 13    # Value of Movable Property
COL_VALUE_TOTAL = 14      # Total Value
COL_NOTICE_ISSUED = 15    # Notice issued (Yes/No)
COL_SCN_DATE = 16         # Date of SCN issuance
COL_GROUP = 17            # Group
COL_SIO_NAME = 18         # SIO/IO name


# ─── Helper Functions ─────────────────────────────────────────────────────────

def current_fy() -> str:
    """Returns FY in YY-YY format (e.g., '26-27')."""
    now = datetime.now()
    yr = now.year
    start = yr if now.month >= 4 else yr - 1
    return f"{str(start)[2:]}-{str(start + 1)[2:]}"


def generate_record_id(sb, workspace_id: str) -> str:
    """Generate sequential PA/###/YY-YY record ID."""
    res = (
        sb.table("dggi_provisional_attachment_records")
        .select("*", count="exact", head=True)
        .eq("workspace_id", workspace_id)
        .execute()
    )
    count = res.count or 0
    seq = str(count + 1).zfill(3)
    return f"PA/{seq}/{current_fy()}"


def parse_date(val) -> str | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.date().isoformat()
    if isinstance(val, date):
        return val.isoformat()
    s = str(val).strip()
    if not s or s.upper() in ("NA", "-"):
        return None
    for fmt in ("%d.%m.%Y", "%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            pass
    return None


def clean(val) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    if s in ("-", "") or s.upper() == "NA":
        return None
    return s


def normalize_group(val) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return None
    if s.startswith("Group "):
        return s
    if len(s) == 1 and s.upper() in "ABCDEF":
        return f"Group {s.upper()}"
    return s


def generate_batch_id(ir_no: str) -> str | None:
    if not ir_no:
        return None
    key = ir_no.strip().lower()
    hash_val = hashlib.sha256(key.encode()).hexdigest()[:8]
    return f"PA-BATCH-{hash_val}"


def lookup_linked_case_id(sb, workspace_id: str, ir_no: str) -> str | None:
    if not ir_no:
        return None
    res = (
        sb.table("dggi_records")
        .select("record_id")
        .eq("workspace_id", workspace_id)
        .eq("record_id", ir_no)
        .limit(1)
        .execute()
    )
    if res.data:
        return res.data[0]["record_id"]
    return None


def lookup_sio_uuid(sb, workspace_id: str, name: str) -> str | None:
    if not name:
        return None
    res = (
        sb.table("votum_users")
        .select("id")
        .eq("workspace_id", workspace_id)
        .ilike("name", name.strip())
        .limit(1)
        .execute()
    )
    if res.data:
        return res.data[0]["id"]
    return None


# ─── Processor ────────────────────────────────────────────────────────────────

def process_row(
    row: tuple,
    sb,
    workspace_id: str,
    skipped: list,
    dry_run: bool,
) -> str:
    """
    Process one Excel row → insert into dggi_provisional_attachment_records.
    Returns "inserted" | "skipped".
    """
    date_of_attachment = parse_date(row[COL_DATE_ATTACHMENT])
    if not date_of_attachment:
        return "skipped"

    ir_no = clean(row[COL_IR_NO])
    sio_name = clean(row[COL_SIO_NAME])
    bank_acct = clean(row[COL_BANK_ACCT])

    linked_case_id = lookup_linked_case_id(sb, workspace_id, ir_no) if not dry_run else None
    sio_uuid = lookup_sio_uuid(sb, workspace_id, sio_name) if sio_name and not dry_run else None
    batch_id = generate_batch_id(ir_no) if ir_no else None

    payload = {
        "workspace_id": workspace_id,
        "record_id": generate_record_id(sb, workspace_id) if not dry_run else "PA/DRY/00-00",
        "linked_scn_no": None,
        "linked_case_id": linked_case_id,
        "attachment_batch_id": batch_id,
        "issue_involved": clean(row[COL_TYPOLOGY]),
        "bank_account_no": bank_acct,
        "bank_name": clean(row[COL_BANK_NAME]),
        "bank_ifsc": clean(row[COL_BANK_IFSC]),
        "date_of_attachment": date_of_attachment,
        "value_immovable": clean(row[COL_VALUE_IMMOVABLE]),
        "value_movable": clean(row[COL_VALUE_MOVABLE]),
        "value_bank": clean(row[COL_VALUE_TOTAL]),
        "value_total": str(round(sum(
            float(v) for v in [
                clean(row[COL_VALUE_IMMOVABLE]),
                clean(row[COL_VALUE_MOVABLE]),
                clean(row[COL_VALUE_TOTAL]),  # bank
            ] if v is not None
        ), 4)) if any(clean(row[c]) for c in [COL_VALUE_IMMOVABLE, COL_VALUE_MOVABLE, COL_VALUE_TOTAL]) else None,
        "letter_issued": clean(row[COL_NOTICE_ISSUED]),
        "date_of_scn_issuance": parse_date(row[COL_SCN_DATE]),
        "scn_issued": "Yes" if parse_date(row[COL_SCN_DATE]) else None,
        "group": normalize_group(row[COL_GROUP]),
        "group_sio": sio_name,
        "sio_name": sio_name,
        "sio": sio_uuid,
    }

    # Drop None values
    payload = {k: v for k, v in payload.items() if v is not None}

    try:
        if not dry_run:
            sb.table("dggi_provisional_attachment_records").insert(payload).execute()
        return "inserted"
    except Exception as e:
        skipped.append({
            "ir_no": ir_no or "",
            "date_of_attachment": date_of_attachment,
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

    res = sb.table("votum_users").select("workspace_id, id").eq("email", WORKSPACE_OWNER_EMAIL).limit(1).execute()
    if not res.data:
        raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")

    workspace_id = res.data[0]["workspace_id"]
    print(f"Workspace: {workspace_id}\n")

    skipped = []
    inserted = 0
    skipped_count = 0

    rows = list(ws.iter_rows(values_only=True))

    for row_idx, row in enumerate(rows[5:], start=6):  # rows 1-5 are headers
        if not any(row):
            continue
        status = process_row(row, sb, workspace_id, skipped, dry_run)
        if status == "inserted":
            inserted += 1
        else:
            skipped_count += 1

    print(f"\n{'=' * 60}")
    print(f"[Provisional Attachments] {'Would insert' if dry_run else 'Inserted'}: {inserted} | Skipped: {skipped_count}")
    print(f"{'=' * 60}")

    if skipped:
        if not dry_run:
            with open(SKIPPED_CSV, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=list(skipped[0].keys()))
                writer.writeheader()
                writer.writerows(skipped)
            print(f"\nSkipped {len(skipped)} rows — see {SKIPPED_CSV}")
        else:
            print(f"\nWould skip {len(skipped)} error rows.")
    else:
        print("\nNo rows skipped.")

    print("\nDry run complete — no data written." if dry_run else "\nDone.")


if __name__ == "__main__":
    main()

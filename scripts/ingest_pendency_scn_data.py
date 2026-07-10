"""
Ingest Pendency / SCN / NON-IR Excel data into Supabase.

Source: 'Pendency, SCN & Saadhit Target-2 Data.xlsx'
  - Sheet 'FInal Pendency' → dggi_records (is_ir=True)  ~92 rows
  - Sheet 'SCN'             → dggi_scn_records            ~18 rows
  - Sheet 'NON-IR'          → dggi_records (is_ir=False) ~32 rows

Upsert strategy:
  - dggi_records:     match on (workspace_id, file_no); update if exists, insert if not
  - dggi_scn_records: match on (workspace_id, scn_no);  update if exists, insert if not

Usage:
    python3 scripts/ingest_pendency_scn_data.py [/path/to/file.xlsx] [--dry-run]
"""

import csv
import os
import sys
from datetime import date, datetime

import openpyxl
from supabase import create_client

SUPABASE_URL = "https://zrkvvedwycdcjjheewef.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3Z2ZWR3eWNkY2pqaGVld2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzAxNjg1NCwiZXhwIjoyMDE4NTkyODU0fQ.ZYgzzv6E--3v2un2uN0jXwHnBvCf0EjPJlGoCQwiqKE"

WORKSPACE_OWNER_EMAIL = "ajinkya@gov.in"

DEFAULT_EXCEL_PATH = os.path.join(
    os.path.expanduser("~"),
    "Downloads",
    "Pendency, SCN & Saadhit Target-2 Data.xlsx",
)

SKIPPED_CSV = os.path.join(os.path.dirname(__file__), "ingest_skipped.csv")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_date(val) -> str | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.date().isoformat()
    if isinstance(val, date):
        return val.isoformat()
    s = str(val).strip()
    if not s:
        return None
    for fmt in ("%d.%m.%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            pass
    return None


def normalize_group(val) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    if s.startswith("Group "):
        return s
    if len(s) == 1 and s.upper() in "ABCDEF":
        return f"Group {s.upper()}"
    return None


def clean(val) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


def str_amount(val) -> str | None:
    if val is None:
        return None
    try:
        f = float(val)
        return str(f) if f != 0 else None
    except (ValueError, TypeError):
        s = str(val).strip()
        return s if s else None


# ---------------------------------------------------------------------------
# Upsert helpers
# ---------------------------------------------------------------------------

def upsert_dggi_record(sb, workspace_id: str, file_no: str | None, payload: dict, skipped: list, label: str, dry_run: bool = False):
    try:
        if file_no:
            existing = (
                sb.table("dggi_records")
                .select("id")
                .eq("workspace_id", workspace_id)
                .eq("file_no", file_no)
                .execute()
            )
            if existing.data:
                if not dry_run:
                    sb.table("dggi_records").update(payload).eq("id", existing.data[0]["id"]).execute()
                return "updated"
        if not dry_run:
            sb.table("dggi_records").insert({**payload, "workspace_id": workspace_id, "file_no": file_no}).execute()
        return "inserted"
    except Exception as e:
        skipped.append({"sheet": label, "file_no": file_no or "", "reason": str(e)})
        return "skipped"


def upsert_scn_record(sb, workspace_id: str, scn_no: str | None, payload: dict, skipped: list, dry_run: bool = False):
    try:
        if scn_no:
            existing = (
                sb.table("dggi_scn_records")
                .select("id")
                .eq("workspace_id", workspace_id)
                .eq("scn_no", scn_no)
                .execute()
            )
            if existing.data:
                if not dry_run:
                    sb.table("dggi_scn_records").update(payload).eq("id", existing.data[0]["id"]).execute()
                return "updated"
        if not dry_run:
            sb.table("dggi_scn_records").insert({**payload, "workspace_id": workspace_id, "scn_no": scn_no}).execute()
        return "inserted"
    except Exception as e:
        skipped.append({"sheet": "SCN", "scn_no": scn_no or "", "reason": str(e)})
        return "skipped"


# ---------------------------------------------------------------------------
# Sheet processors
# ---------------------------------------------------------------------------

def process_pendency(ws, sb, workspace_id: str, skipped: list):
    rows = list(ws.iter_rows(values_only=True))
    inserted = updated = skipped_count = 0

    for row in rows[2:]:  # row 0 = title, row 1 = headers
        taxpayer_name = clean(row[1])
        if not taxpayer_name:
            continue

        detection_date = parse_date(row[4])
        issue_parts = []
        if clean(row[13]):
            issue_parts.append(clean(row[13]))
        if clean(row[12]):
            issue_parts.append(f"Type: {clean(row[12])}")
        if clean(row[18]):
            issue_parts.append(f"Section: {clean(row[18])}")

        payload = {
            "taxpayer_name": taxpayer_name,
            "gstins": clean(row[2]),
            "date_of_ir": detection_date,
            "date_of_initiation": detection_date,
            "detection_amount": str_amount(row[8]),
            "recovery_itc": str_amount(row[10]),
            "issue_involved": " | ".join(issue_parts) if issue_parts else None,
            "latest_status": clean(row[14]),
            "due_date": parse_date(row[15]),
            "handling_io_sio_name": clean(row[16]),
            "group": normalize_group(row[17]),
            "digit_id": clean(row[19]),
            "is_ir": True,
        }
        # Remove None values to avoid overwriting DB fields with NULL
        payload = {k: v for k, v in payload.items() if v is not None}

        file_no = clean(row[3])
        result = upsert_dggi_record(sb, workspace_id, file_no, payload, skipped, "FInal Pendency")
        if result == "inserted":
            inserted += 1
        elif result == "updated":
            updated += 1
        else:
            skipped_count += 1

    print(f"[IR Pendency]  Inserted: {inserted} | Updated: {updated} | Skipped: {skipped_count}")


def process_scn(ws, sb, workspace_id: str, skipped: list):
    rows = list(ws.iter_rows(values_only=True))
    inserted = updated = skipped_count = 0

    for row in rows[2:]:
        noticee_name = clean(row[2])
        if not noticee_name:
            continue

        remarks_parts = []
        if clean(row[10]):
            remarks_parts.append(f"Zone: {clean(row[10])}")
        if clean(row[1]):
            remarks_parts.append(f"Detection: {clean(row[1])}")

        payload = {
            "noticee_name": noticee_name,
            "gstin_pan": clean(row[3]),
            "date_of_scn": parse_date(row[5]),
            "demand_tax": str_amount(row[6]),
            "adjudicating_authority": clean(row[7]),
            "common_adjudicating_authority": clean(row[8]),
            "adjudication_formation": clean(row[9]),
            "period_involved": clean(row[11]),
            "sio_name": clean(row[12]),
            "group": normalize_group(row[13]),
            "remarks": " | ".join(remarks_parts) if remarks_parts else None,
        }
        payload = {k: v for k, v in payload.items() if v is not None}

        scn_no = clean(row[4])
        result = upsert_scn_record(sb, workspace_id, scn_no, payload, skipped)
        if result == "inserted":
            inserted += 1
        elif result == "updated":
            updated += 1
        else:
            skipped_count += 1

    print(f"[SCN]          Inserted: {inserted} | Updated: {updated} | Skipped: {skipped_count}")


def process_non_ir(ws, sb, workspace_id: str, skipped: list):
    rows = list(ws.iter_rows(values_only=True))
    inserted = updated = skipped_count = 0

    for row in rows[2:]:
        taxpayer_name = clean(row[1])
        if not taxpayer_name:
            continue

        initiation_date = parse_date(row[3])
        mode = clean(row[6])
        # mode_of_initiation CHECK constraint: Letter/Email/Summons/Inspection/Search
        if mode and mode not in ("Letter", "Email", "Summons", "Inspection", "Search"):
            mode = None  # don't write invalid value

        payload = {
            "taxpayer_name": taxpayer_name,
            "gstins": clean(row[2]),
            "date_of_initiation": initiation_date,
            "date_of_non_ir": initiation_date,
            "handling_io_sio_name": clean(row[4]),
            "group": normalize_group(row[5]),
            "mode_of_initiation": mode,
            "latest_status": clean(row[8]),
            "is_ir": False,
        }
        payload = {k: v for k, v in payload.items() if v is not None}

        # Prefer IR No as file_no key; fall back to GSTIN
        ir_no = clean(row[9])
        gstin = clean(row[2])
        file_no = ir_no or gstin

        result = upsert_dggi_record(sb, workspace_id, file_no, payload, skipped, "NON-IR")
        if result == "inserted":
            inserted += 1
        elif result == "updated":
            updated += 1
        else:
            skipped_count += 1

    print(f"[NON-IR]       Inserted: {inserted} | Updated: {updated} | Skipped: {skipped_count}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    excel_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_EXCEL_PATH
    if not os.path.exists(excel_path):
        raise SystemExit(f"Excel file not found: {excel_path}")

    print(f"Loading: {excel_path}")
    wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)

    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    res = sb.table("votum_users").select("workspace_id").eq("email", WORKSPACE_OWNER_EMAIL).limit(1).execute()
    if not res.data:
        raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")
    workspace_id = res.data[0]["workspace_id"]
    print(f"Workspace: {workspace_id}\n")

    skipped = []

    process_pendency(wb["FInal Pendency"], sb, workspace_id, skipped)
    process_scn(wb["SCN"], sb, workspace_id, skipped)
    process_non_ir(wb["NON-IR"], sb, workspace_id, skipped)

    if skipped:
        with open(SKIPPED_CSV, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=list(skipped[0].keys()))
            writer.writeheader()
            writer.writerows(skipped)
        print(f"\nSkipped {len(skipped)} rows — see {SKIPPED_CSV}")
    else:
        print("\nNo rows skipped.")

    print("\nDone.")


if __name__ == "__main__":
    main()

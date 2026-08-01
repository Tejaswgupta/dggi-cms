"""
Ingest NON-IR Register data into Supabase dggi_records.

Source: 'NON_IR_Register_DGGI_MZU_upto_09_July_2026.xlsx'
        Sheet: 'final with random allott of cas'  (128 rows)

Column mapping:
  Col 0  Sr No            → sr_no (skip validation key)
  Col 1  File Number      → file_no (dedup key)
  Col 2  Date of NON-IR   → date_of_non_ir
  Col 3  Officer Name     → sio_name
  Col 4  Group Name       → group (stored as-is, e.g. "A", "B" → "Group A", "Group B")
  Col 5  E-Mail ID        → (skipped)

Dedup strategy:
  1. Match on file_no in DB → update
  2. No match → insert with sequential NIR-NNN record_id

NOTE: Does NOT touch dggi_closure_records.

Usage:
    python3 scripts/ingest_non_ir_register.py [/path/to/file.xlsx] [--dry-run]
"""

import csv
import json
import os
import sys
from datetime import date, datetime

import openpyxl
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

WORKSPACE_OWNER_EMAIL = "ajinkya.k1@gov.in"

DEFAULT_EXCEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
    "NON_IR_Register_DGGI_MZU_upto_09_July_2026.xlsx",
)

SHEET_NAME = "final with random allott of cas"

SKIPPED_CSV = os.path.join(os.path.dirname(__file__), "ingest_non_ir_register_skipped.csv")
LOG_JSON = os.path.join(os.path.dirname(__file__), "ingest_non_ir_register_log.json")


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


def clean(val) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


# ---------------------------------------------------------------------------
# Sequential NON-IR record_id generator
# ---------------------------------------------------------------------------

def next_non_ir_seq(sb, workspace_id: str) -> int:
    import re
    res = (
        sb.table("dggi_records")
        .select("record_id")
        .eq("workspace_id", workspace_id)
        .eq("is_ir", False)
        .like("record_id", "NIR-%")
        .execute()
    )
    max_seq = 0
    for r in res.data:
        m = re.match(r"NIR-(\d+)$", r["record_id"] or "")
        if m:
            max_seq = max(max_seq, int(m.group(1)))
    return max_seq + 1


# ---------------------------------------------------------------------------
# Upsert: match on file_no → update; no match → insert
# ---------------------------------------------------------------------------

def upsert_record(
    sb,
    workspace_id: str,
    sr_no: int,
    payload: dict,
    skipped: list,
    log: list,
    dry_run: bool = False,
) -> str:
    file_no = payload.get("file_no")
    record_id = payload["record_id"]
    try:
        # 1. Match on file_no
        if file_no:
            res = (
                sb.table("dggi_records")
                .select("id,record_id,file_no")
                .eq("workspace_id", workspace_id)
                .eq("file_no", file_no)
                .execute()
            )
            if res.data:
                row = res.data[0]
                if dry_run:
                    print(f"    → UPDATE (file_no)  existing={row['record_id']!r}  db_id={row['id']}")
                else:
                    sb.table("dggi_records").update(payload).eq("id", row["id"]).execute()
                log.append({"action": "update", "match_by": "file_no", "sr_no": sr_no,
                            "record_id": row["record_id"], "db_id": row["id"]})
                return "updated"

        # 2. Insert
        insert_payload = {**payload, "workspace_id": workspace_id}
        if dry_run:
            print(f"    → INSERT  record_id={record_id!r}  file_no={file_no!r}")
            inserted_id = None
        else:
            insert_res = sb.table("dggi_records").insert(insert_payload).execute()
            inserted_id = insert_res.data[0]["id"] if insert_res.data else None
        log.append({"action": "insert", "sr_no": sr_no, "record_id": record_id, "db_id": inserted_id})
        return "inserted"

    except Exception as e:
        skipped.append({"sr_no": sr_no, "record_id": record_id, "file_no": file_no, "reason": str(e)})
        return "skipped"


# ---------------------------------------------------------------------------
# Sheet processor
# ---------------------------------------------------------------------------

def process_sheet(ws, sb, workspace_id: str, start_seq: int, skipped: list, log: list, dry_run: bool = False):
    rows = list(ws.iter_rows(values_only=True))

    # row[0] is the header row; data starts at row[1]
    seq = start_seq
    inserted = updated = skipped_count = 0

    for row in rows[1:]:
        if row[0] is None:
            continue
        try:
            sr_no = int(row[0])
        except (ValueError, TypeError):
            continue

        file_no = clean(row[1])
        nir_date = parse_date(row[2])
        officer_name = clean(row[3])
        group_raw = clean(row[4])
        group_val = f"Group {group_raw}" if group_raw else None

        record_id = f"NIR-{seq:03d}"
        seq += 1

        payload = {
            "record_id": record_id,
            "file_no": file_no,
            "date_of_non_ir": nir_date,
            "sio_name": officer_name,
            "group": group_val,
            "is_ir": False,
        }
        # Drop None values except record_id
        payload = {k: v for k, v in payload.items() if v is not None or k == "record_id"}

        if dry_run:
            print(
                f"  [#{sr_no:03d}] file_no={file_no!r} | date={nir_date}"
                f" | group={group_val!r} | sio={officer_name!r} → {record_id}"
            )

        result = upsert_record(sb, workspace_id, sr_no, payload, skipped, log, dry_run)
        if result == "inserted":
            inserted += 1
        elif result == "updated":
            updated += 1
        else:
            skipped_count += 1

    print(
        f"\n[NON-IR Register]  {'Would insert' if dry_run else 'Inserted'}: {inserted}"
        f" | {'Would update' if dry_run else 'Updated'}: {updated}"
        f" | Skipped: {skipped_count}"
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    positional = [a for a in args if not a.startswith("--")]
    excel_path = os.path.abspath(positional[0] if positional else DEFAULT_EXCEL_PATH)

    if not os.path.exists(excel_path):
        raise SystemExit(f"Excel file not found: {excel_path}")

    if dry_run:
        print("*** DRY RUN — no changes will be written to the database ***\n")

    print(f"Loading: {excel_path}")
    wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)

    if SHEET_NAME not in wb.sheetnames:
        raise SystemExit(f"Sheet {SHEET_NAME!r} not found. Available: {wb.sheetnames}")

    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    res = (
        sb.table("votum_users")
        .select("workspace_id")
        .eq("email", WORKSPACE_OWNER_EMAIL)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")
    workspace_id = res.data[0]["workspace_id"]
    print(f"Workspace: {workspace_id}")

    start_seq = next_non_ir_seq(sb, workspace_id)
    print(f"Next NIR sequence starts at: {start_seq}\n")

    skipped = []
    log = []
    process_sheet(wb[SHEET_NAME], sb, workspace_id, start_seq, skipped, log, dry_run)

    if log:
        with open(LOG_JSON, "w") as f:
            json.dump(log, f, indent=2)
        inserts = len([e for e in log if e["action"] == "insert"])
        updates = len([e for e in log if e["action"] == "update"])
        print(f"\nLog written to {LOG_JSON}  ({inserts} inserts, {updates} updates)")

    if skipped:
        if not dry_run:
            with open(SKIPPED_CSV, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=list(skipped[0].keys()))
                writer.writeheader()
                writer.writerows(skipped)
            print(f"\nSkipped {len(skipped)} rows — see {SKIPPED_CSV}")
        else:
            print(f"\nWould skip {len(skipped)} rows (errors during DB lookup).")
    else:
        print("\nNo rows skipped.")

    print("\nDry run complete — no data written." if dry_run else "\nDone.")


if __name__ == "__main__":
    main()

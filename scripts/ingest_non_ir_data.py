"""
Ingest NON-IR register data into Supabase dggi_records.

Source: 'NON_IR_Register_DGGI_MZU_upto_09_July_2026.xlsx'
        Sheet: 'final with random allott of cas'  (130 rows)

Column mapping:
  Col 0  Sr No             → upsert key (fallback record_id = "NON-IR-{sr_no:03d}")
  Col 1  File Number       → record_id (upsert key 1) + file_no
  Col 2  Date of NON-IR    → date_of_non_ir
  Col 3  Officer Name      → handling_io_sio_name (text fallback)
  Col 4  Group Name        → group (prefixed "Group " + letter)
  Col 5  E-Mail ID         → lookup votum_users.email → handling_io_sio (UUID)

Dedup strategy (checked in order):
  1. File Number match  — exact match of col 1 vs record_id in DB  (primary)
  2. No match          → insert; record_id = File Number (fallback "NON-IR-{sr_no:03d}")

Usage:
    python3 scripts/ingest_non_ir_data.py [/path/to/file.xlsx] [--dry-run]
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

SKIPPED_CSV = os.path.join(os.path.dirname(__file__), "ingest_non_ir_skipped.csv")
LOG_JSON = os.path.join(os.path.dirname(__file__), "ingest_non_ir_log.json")


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
# Email → user UUID cache
# ---------------------------------------------------------------------------

def build_user_cache(sb, workspace_id: str) -> dict:
    """Return {email_lower: user_id} for all users in the workspace."""
    res = (
        sb.table("votum_users")
        .select("id,email")
        .eq("workspace_id", workspace_id)
        .execute()
    )
    cache = {}
    for u in res.data:
        if u.get("email"):
            cache[u["email"].strip().lower()] = u["id"]
    return cache


# ---------------------------------------------------------------------------
# Sequential NON-IR record_id generator
# ---------------------------------------------------------------------------

def fy_short(date_str: str | None) -> str:
    """'2026-05-01' → '26-27'"""
    if not date_str:
        from datetime import date
        now = date.today()
        s = now.year if now.month >= 4 else now.year - 1
    else:
        year, month = int(date_str[:4]), int(date_str[5:7])
        s = year if month >= 4 else year - 1
    return f"{str(s)[2:]}-{str(s + 1)[2:]}"


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
        m = re.match(r"NIR-(\d+)-", r["record_id"] or "")
        if m:
            max_seq = max(max_seq, int(m.group(1)))
    return max_seq + 1


# ---------------------------------------------------------------------------
# Upsert: file_no column match → update; no match → insert
# record_id is pre-assigned by the caller (date-sorted sequence)
# ---------------------------------------------------------------------------

def upsert_non_ir_record(
    sb,
    workspace_id: str,
    sr_no: int,
    file_no: str | None,
    payload: dict,
    skipped: list,
    log: list,
    dry_run: bool = False,
) -> str:
    new_record_id = payload["record_id"]
    try:
        # 1. Match on file_no column → update in place with new record_id
        if file_no:
            res = (
                sb.table("dggi_records")
                .select("id,record_id")
                .eq("workspace_id", workspace_id)
                .eq("file_no", file_no)
                .execute()
            )
            if res.data:
                row = res.data[0]
                if dry_run:
                    print(f"    → UPDATE (file_no)  existing record_id={row['record_id']!r} → {new_record_id!r}  db_id={row['id']}")
                else:
                    sb.table("dggi_records").update(payload).eq("id", row["id"]).execute()
                log.append({"action": "update", "match_by": "file_no", "sr_no": sr_no, "file_no": file_no, "old_record_id": row["record_id"], "new_record_id": new_record_id, "db_id": row["id"]})
                return "updated"

        # 2. Insert with pre-assigned record_id
        insert_payload = {**payload, "workspace_id": workspace_id}
        if dry_run:
            print(f"    → INSERT  new record_id={new_record_id!r}")
            inserted_id = None
        else:
            insert_res = sb.table("dggi_records").insert(insert_payload).execute()
            inserted_id = insert_res.data[0]["id"] if insert_res.data else None
        log.append({"action": "insert", "sr_no": sr_no, "new_record_id": new_record_id, "db_id": inserted_id, "file_no": file_no})
        return "inserted"

    except Exception as e:
        skipped.append({"sr_no": sr_no, "file_no": file_no or "", "reason": str(e)})
        return "skipped"


# ---------------------------------------------------------------------------
# Sheet processor — sorts all rows by date first, assigns record_ids in order
# ---------------------------------------------------------------------------

def process_sheet(ws, sb, workspace_id: str, user_cache: dict, start_seq: int, skipped: list, log: list, dry_run: bool = False):
    rows = list(ws.iter_rows(values_only=True))
    fy = fy_short(None)  # current FY e.g. "26-27"

    # First pass: collect all valid rows
    records = []
    for row in rows[1:]:
        if row[0] is None:
            continue
        try:
            sr_no = int(row[0])
        except (ValueError, TypeError):
            continue
        records.append({
            "sr_no": sr_no,
            "file_no": clean(row[1]),
            "ir_date": parse_date(row[2]),
            "officer_name": clean(row[3]),
            "group_val": f"Group {clean(row[4])}" if clean(row[4]) else None,
            "officer_email": clean(row[5]),
        })

    # Sort by date ascending so earlier cases get lower sequence numbers
    records.sort(key=lambda r: r["ir_date"] or "9999-99-99")

    inserted = updated = skipped_count = 0
    unmatched_emails = set()

    for idx, rec in enumerate(records):
        new_record_id = f"NIR-{idx + 1:03d}-{fy}"
        sr_no = rec["sr_no"]
        file_no = rec["file_no"]

        handling_io_sio_id = None
        if rec["officer_email"]:
            handling_io_sio_id = user_cache.get(rec["officer_email"].lower())
            if not handling_io_sio_id:
                unmatched_emails.add(rec["officer_email"])

        payload = {
            "record_id": new_record_id,
            "file_no": file_no,
            "date_of_non_ir": rec["ir_date"],
            "group": rec["group_val"],
            "handling_io_sio_name": rec["officer_name"],
            "handling_io_sio": handling_io_sio_id,
            "is_ir": False,
            "date_of_ir": None,
            "date_of_initiation": None,
        }
        payload = {k: v for k, v in payload.items() if v is not None or k in ("date_of_ir", "date_of_initiation", "record_id")}

        if dry_run:
            matched = f"→ {handling_io_sio_id}" if handling_io_sio_id else "NO MATCH"
            print(
                f"  [#{sr_no:03d}] file_no={file_no!r}"
                f" | date={rec['ir_date']} | group={rec['group_val']!r} | officer={rec['officer_name']!r}"
                f" | email={rec['officer_email']!r} ({matched}) → {new_record_id}"
            )

        result = upsert_non_ir_record(
            sb, workspace_id, sr_no, file_no, payload, skipped, log, dry_run
        )
        if result == "inserted":
            inserted += 1
        elif result == "updated":
            updated += 1
        else:
            skipped_count += 1

    print(
        f"\n[NON-IR]  {'Would insert' if dry_run else 'Inserted'}: {inserted}"
        f" | {'Would update' if dry_run else 'Updated'}: {updated}"
        f" | Skipped: {skipped_count}"
    )
    if unmatched_emails:
        print(f"\nWarning: {len(unmatched_emails)} email(s) not found in votum_users (handling_io_sio left null):")
        for e in sorted(unmatched_emails):
            print(f"  {e}")


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

    user_cache = build_user_cache(sb, workspace_id)
    print(f"Loaded {len(user_cache)} users from votum_users")

    start_seq = next_non_ir_seq(sb, workspace_id)
    print(f"Next NON-IR sequence starts at: {start_seq}\n")

    skipped = []
    log = []
    process_sheet(wb[SHEET_NAME], sb, workspace_id, user_cache, start_seq, skipped, log, dry_run)

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

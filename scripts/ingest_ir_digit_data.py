"""
Ingest IR issued data (April 26 – 15 July DIGIT) into Supabase dggi_records.

Source: 'IR issued data april 26 to 15 july DIGIT.xlsx'  (Sheet1, 82 rows)

Column mapping:
  Col 0  Sr.No.                         → upsert key (fallback record_id = "DIGIT-{sr_no:03d}")
  Col 1  Digit Id                        → digit_id  (upsert key 1; DB stores without "DIGIT-" prefix)
  Col 2  Formation                       → adjudication_formation
  Col 3  Year                            → (skipped — derivable from IR Date)
  Col 4  Name of the Company             → taxpayer_name
  Col 5  Noticee                         → (all null in source — skipped)
  Col 6  PAN                             → (all null in source — skipped)
  Col 7  GSTIN                           → gstins
  Col 8  File No.                        → file_no
  Col 9  IR No.                          → upsert key 2 (exact match vs record_id); also in issue_involved
  Col 10 IR Date                         → date_of_ir + date_of_initiation
  Col 11 Amount Of Evasion Detected      → detection_amount
  Col 12 Amount Recovered (If any)       → recovery_itc
  Col 13 Present Status                  → latest_status
  Col 14 Modus Operandi                  → issue_involved (primary)
  Col 15 Nature of Tax                   → combined into issue_involved
  Col 16 Classification of Tax Evasion   → combined into issue_involved
  Col 17 Assigned To                     → handling_io_sio_name (text; no UUID mapping)

Dedup strategy (checked in order):
  1. IR No. match    — exact match of col 9 vs record_id in DB  (primary)
  2. digit_id match  — Excel "DIGIT-XYZ" → strip "DIGIT-" prefix → match DB digit_id  (fallback)
  3. No match        → insert; record_id = "DIGIT-{sr_no:03d}"

Usage:
    python3 scripts/ingest_ir_digit_data.py [/path/to/file.xlsx] [--dry-run]
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
    "IR issued data april 26 to 15 july DIGIT.xlsx",
)

SKIPPED_CSV = os.path.join(os.path.dirname(__file__), "ingest_ir_digit_skipped.csv")
LOG_JSON = os.path.join(os.path.dirname(__file__), "ingest_ir_digit_log.json")


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


def str_amount(val) -> str | None:
    if val is None:
        return None
    try:
        f = float(val)
        return str(f) if f != 0 else None
    except (ValueError, TypeError):
        s = str(val).strip()
        return s if s else None


def strip_digit_prefix(digit_id: str | None) -> str | None:
    """'DIGIT-20260401132436-258' → '20260401132436-258' (how DB stores it)"""
    if not digit_id:
        return None
    if digit_id.upper().startswith("DIGIT-"):
        return digit_id[6:]
    return digit_id


# ---------------------------------------------------------------------------
# Upsert: digit_id → IR No (record_id) → insert
# ---------------------------------------------------------------------------

def upsert_ir_record(
    sb,
    workspace_id: str,
    sr_no: int,
    digit_id_raw: str | None,
    ir_no: str | None,
    payload: dict,
    skipped: list,
    log: list,
    dry_run: bool = False,
) -> str:
    try:
        # 1. Match on IR No. vs record_id (primary key)
        if ir_no:
            res = (
                sb.table("dggi_records")
                .select("id,record_id")
                .eq("workspace_id", workspace_id)
                .eq("record_id", ir_no)
                .execute()
            )
            if res.data:
                row = res.data[0]
                if dry_run:
                    print(f"    → UPDATE (ir_no)  existing record_id={row['record_id']!r}  db_id={row['id']}")
                else:
                    sb.table("dggi_records").update(payload).eq("id", row["id"]).execute()
                log.append({"action": "update", "match_by": "ir_no", "sr_no": sr_no, "excel_ir_no": ir_no, "existing_record_id": row["record_id"], "db_id": row["id"], "digit_id": digit_id_raw, "taxpayer_name": payload.get("taxpayer_name")})
                return "updated"

        # 2. Match on digit_id (strip "DIGIT-" prefix before comparing)
        digit_id_db = strip_digit_prefix(digit_id_raw)
        if digit_id_db:
            res = (
                sb.table("dggi_records")
                .select("id,record_id")
                .eq("workspace_id", workspace_id)
                .eq("digit_id", digit_id_db)
                .execute()
            )
            if res.data:
                row = res.data[0]
                if dry_run:
                    print(f"    → UPDATE (digit_id)  existing record_id={row['record_id']!r}  db_id={row['id']}")
                else:
                    sb.table("dggi_records").update(payload).eq("id", row["id"]).execute()
                log.append({"action": "update", "match_by": "digit_id", "sr_no": sr_no, "excel_ir_no": ir_no, "existing_record_id": row["record_id"], "db_id": row["id"], "digit_id": digit_id_raw, "taxpayer_name": payload.get("taxpayer_name")})
                return "updated"

        # 3. Insert — use ir_no as record_id (fallback to DIGIT-{sr_no:03d} if missing)
        new_record_id = ir_no or f"DIGIT-{sr_no:03d}"
        full_payload = {**payload, "workspace_id": workspace_id, "record_id": new_record_id}
        if dry_run:
            print(f"    → INSERT  new record_id={new_record_id!r}")
            inserted_id = None
        else:
            insert_res = sb.table("dggi_records").insert(full_payload).execute()
            inserted_id = insert_res.data[0]["id"] if insert_res.data else None
        log.append({"action": "insert", "sr_no": sr_no, "new_record_id": new_record_id, "db_id": inserted_id, "excel_ir_no": ir_no, "digit_id": digit_id_raw, "taxpayer_name": payload.get("taxpayer_name")})
        return "inserted"

    except Exception as e:
        skipped.append({"sr_no": sr_no, "digit_id": digit_id_raw or "", "ir_no": ir_no or "", "reason": str(e)})
        return "skipped"


# ---------------------------------------------------------------------------
# Sheet processor
# ---------------------------------------------------------------------------

def process_sheet(ws, sb, workspace_id: str, skipped: list, log: list, dry_run: bool = False):
    rows = list(ws.iter_rows(values_only=True))
    inserted = updated = skipped_count = 0

    for row in rows[1:]:  # row 0 = headers
        if row[0] is None:
            continue
        try:
            sr_no = int(row[0])
        except (ValueError, TypeError):
            continue

        taxpayer_name = clean(row[4])
        if not taxpayer_name:
            continue

        ir_date = parse_date(row[10])
        digit_id_raw = clean(row[1])
        ir_no = clean(row[9])

        issue_parts = []
        if clean(row[14]):
            issue_parts.append(clean(row[14]))
        if clean(row[16]) and clean(row[16]) != clean(row[14]):
            issue_parts.append(f"Classification: {clean(row[16])}")
        if clean(row[15]):
            issue_parts.append(f"Tax: {clean(row[15])}")
        if ir_no:
            issue_parts.append(f"IR No: {ir_no}")

        payload = {
            "taxpayer_name": taxpayer_name,
            "digit_id": strip_digit_prefix(digit_id_raw),
            "gstins": clean(row[7]),
            "file_no": clean(row[8]),
            "date_of_ir": ir_date,
            "date_of_initiation": ir_date,
            "detection_amount": str_amount(row[11]),
            "recovery_itc": str_amount(row[12]),
            "latest_status": clean(row[13]),
            "issue_involved": " | ".join(issue_parts) if issue_parts else None,
            "adjudication_formation": clean(row[2]),
            "handling_io_sio_name": clean(row[17]),
            "is_ir": True,
        }
        payload = {k: v for k, v in payload.items() if v is not None}

        if dry_run:
            print(
                f"  [#{sr_no:02d}] {taxpayer_name[:45]!r}"
                f" | digit_id={digit_id_raw} | ir_no={ir_no}"
            )

        result = upsert_ir_record(
            sb, workspace_id, sr_no, digit_id_raw, ir_no, payload, skipped, log, dry_run
        )
        if result == "inserted":
            inserted += 1
        elif result == "updated":
            updated += 1
        else:
            skipped_count += 1

    print(
        f"\n[IR DIGIT]  {'Would insert' if dry_run else 'Inserted'}: {inserted}"
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
    print(f"Workspace: {workspace_id}\n")

    skipped = []
    log = []
    process_sheet(wb["Sheet1"], sb, workspace_id, skipped, log, dry_run)

    if log:
        with open(LOG_JSON, "w") as f:
            json.dump(log, f, indent=2)
        print(f"\nLog written to {LOG_JSON}  ({len([e for e in log if e['action']=='insert'])} inserts, {len([e for e in log if e['action']=='update'])} updates)")

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

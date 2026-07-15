"""
Backfill created_by_name on existing dggi_arrest_records and
dggi_prosecution_arrest_records rows using the SIO column from the source Excel.

Matching strategy:
  dggi_arrest_records            — matched by (workspace_id, record_id)
  dggi_prosecution_arrest_records — matched by (workspace_id, record_id)

Both record_id sequences were generated deterministically in insertion order
from the same Excel rows, so row N in the sheet maps to ARR/N/YY-YY and PRA/N/YY-YY.

Only rows where date_of_arrest (arrest) or prosecution data exists are considered,
matching the same guards in the original ingest script.

Usage:
    python3 scripts/backfill_created_by_name_arrests.py [/path/to/file.xlsx] [--dry-run]
"""

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
    "Arrests and Prosecutions List.xlsx",
)

# Column indices (0-based) — same as ingest script
COL_SIO = 2
COL_TAXPAYER = 6
COL_ARRESTED_NAME = 10
COL_DATE_OF_ARREST = 15
COL_PROSECUTION_SANCTION_NO = 19
COL_PROSECUTION_SANCTION_DATE = 20
COL_NUM_PROSECUTED = 21


# ─── Helpers ──────────────────────────────────────────────────────────────────

def current_fy() -> str:
    now = datetime.now()
    yr = now.year
    start = yr if now.month >= 4 else yr - 1
    return f"{str(start)[2:]}-{str(start + 1)[2:]}"


def parse_date(val):
    if val is None:
        return None
    if isinstance(val, (datetime, date)):
        return True  # just need to know it's present
    s = str(val).strip()
    return bool(s and s.upper() != "NA")


def clean(val):
    if val is None:
        return None
    s = str(val).strip()
    if s in ("-", "") or s.upper() == "NA":
        return None
    return s


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
    created_by_id = res.data[0]["id"]
    print(f"Workspace: {workspace_id}\n")

    # Fetch all existing record_ids so we can match them
    arr_res = (
        sb.table("dggi_arrest_records")
        .select("id, record_id")
        .eq("workspace_id", workspace_id)
        .order("record_id")
        .execute()
    )
    pra_res = (
        sb.table("dggi_prosecution_arrest_records")
        .select("id, record_id")
        .eq("workspace_id", workspace_id)
        .order("record_id")
        .execute()
    )

    # Build ordered lists matching the original insertion order
    arrest_ids = [r["record_id"] for r in (arr_res.data or [])]
    pros_ids = [r["record_id"] for r in (pra_res.data or [])]

    print(f"Found {len(arrest_ids)} arrest records, {len(pros_ids)} prosecution records in DB.\n")

    rows = list(ws.iter_rows(values_only=True))

    arr_idx = 0   # index into arrest_ids list
    pra_idx = 0   # index into pros_ids list
    arr_updated = arr_skipped = 0
    pra_updated = pra_skipped = 0

    for row_idx, row in enumerate(rows[2:], start=3):
        sio_name = clean(row[COL_SIO])

        # ── Arrest ──────────────────────────────────────────────────────────
        has_arrest = parse_date(row[COL_DATE_OF_ARREST]) and clean(row[COL_TAXPAYER])
        if has_arrest:
            if arr_idx < len(arrest_ids):
                record_id = arrest_ids[arr_idx]
                arr_idx += 1
                if dry_run:
                    print(f"  [DRY] Would update arrest {record_id} → created_by_name={sio_name!r}")
                    arr_updated += 1
                else:
                    try:
                        sb.table("dggi_arrest_records").update({
                            "created_by_name": sio_name,
                            "created_by": created_by_id,
                        }).eq("record_id", record_id).eq("workspace_id", workspace_id).execute()
                        arr_updated += 1
                    except Exception as e:
                        print(f"  ERROR updating arrest {record_id}: {e}")
                        arr_skipped += 1
            else:
                arr_skipped += 1

        # ── Prosecution ──────────────────────────────────────────────────────
        has_prosecution = any([
            clean(row[COL_PROSECUTION_SANCTION_NO]),
            clean(row[COL_PROSECUTION_SANCTION_DATE]),
            clean(row[COL_NUM_PROSECUTED]),
        ])
        if has_prosecution and has_arrest:
            if pra_idx < len(pros_ids):
                record_id = pros_ids[pra_idx]
                pra_idx += 1
                if dry_run:
                    print(f"  [DRY] Would update prosecution {record_id} → created_by_name={sio_name!r}")
                    pra_updated += 1
                else:
                    try:
                        sb.table("dggi_prosecution_arrest_records").update({
                            "created_by_name": sio_name,
                            "created_by": created_by_id,
                        }).eq("record_id", record_id).eq("workspace_id", workspace_id).execute()
                        pra_updated += 1
                    except Exception as e:
                        print(f"  ERROR updating prosecution {record_id}: {e}")
                        pra_skipped += 1
            else:
                pra_skipped += 1

    print(f"\n{'=' * 60}")
    print(f"[Arrests]      {'Would update' if dry_run else 'Updated'}: {arr_updated} | Skipped: {arr_skipped}")
    print(f"[Prosecutions] {'Would update' if dry_run else 'Updated'}: {pra_updated} | Skipped: {pra_skipped}")
    print(f"{'=' * 60}")
    print("\nDry run complete — no data written." if dry_run else "\nDone.")


if __name__ == "__main__":
    main()

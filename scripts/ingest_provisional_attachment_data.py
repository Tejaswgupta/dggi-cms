"""
Ingest Provisional Attachment Register data into Supabase dggi_provisional_attachment_records.

Source: 'Provisional Attachment Register 24.02.2026 (5).xlsx'  (Sheet1, 105 data rows)

Row layout:
  Row 0-3  Title / blank rows
  Row 4    Main header labels
  Row 5    Sub-headers (breakdown of value columns 11-17, status cols 22-26)
  Row 6    Column numbers  — data begins at row 7

Column mapping:
  Col 0   Sr. No.                                              → upsert key; record_id = "PA-{sr_no:03d}"
  Col 1   DGGI Formation                                       → formation
  Col 2   Name of person (Section 83 invoked)                 → taxpayer_name
  Col 3   GSTIN/PAN of person involved                        → gstins
  Col 4   Status of person (Proprietor/Partner/Director …)    → person_status
  Col 5   Expected Liability (Rupees in Crores)               → expected_liability (stored as text)
  Col 6   GSTIN of entity involved                            → entity_gstin
  Col 7   Issue Involved                                       → issue_involved
  Col 8   Brief description of person involvement             → brief_description
  Col 9   Arrest, if any (Yes/No)                             → arrest_status
  Col 10  Dossier prepared and completed (Yes/No)             → dossier_prepared
  Col 11  Value of Immovable Property                         → value_immovable
  Col 12  Value of Movable Property                           → value_movable
  Col 13  Share/Insurance/FD etc.                             → value_shares_fd
  Col 14  Bank A/c                                            → value_bank
  Col 15  Third Party                                         → value_third_party
  Col 16  Others                                              → value_others
  Col 17  Total Value (Rupees in Crores)                      → value_total
  Col 18  Balance Period 0-3 Months                           → balance_period_0_3
  Col 19  Balance Period 3-6 Months                           → balance_period_3_6
  Col 20  Balance Period 6-9 Months                           → balance_period_6_9
  Col 21  Balance Period 9-12 Months                          → balance_period_9_12
  Col 22  Whether investigation completed                     → investigation_completed
  Col 23  Whether SCN issued                                  → scn_issued
  Col 24  Letter to Commissionerate issued                    → letter_issued
  Col 25  Whether OIO issued                                  → oio_issued
  Col 26  Converted to permanent (Section 79)                 → converted_to_permanent
  Col 27  Group/SIO                                           → group_sio
  Col 28  Date of Attachment (DD/MM/YYYY)                     → date_of_attachment

Dedup strategy (checked in order):
  1. record_id match — exact match of "PA-{sr_no:03d}" vs record_id in DB  (primary)
  2. No match → insert; record_id = "PA-{sr_no:03d}"

Usage:
    python3 scripts/ingest_provisional_attachment_data.py [/path/to/file.xlsx] [--dry-run]
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
    "Provisional Attachment Register 24.02.2026 (5).xlsx",
)

SKIPPED_CSV = os.path.join(os.path.dirname(__file__), "ingest_provisional_attachment_skipped.csv")
LOG_JSON = os.path.join(os.path.dirname(__file__), "ingest_provisional_attachment_log.json")


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
    s = str(val).strip().strip("-").strip()
    return s if s else None


def balance_parens(s: str) -> str:
    """Append a closing ')' for every unmatched '(' in the string."""
    diff = s.count("(") - s.count(")")
    return s + ")" * diff if diff > 0 else s


def clean_amount(val) -> str | None:
    """Store amount as text; strips whitespace/dashes but keeps numeric strings intact."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val).strip()
    if not s or s in ("-", "--", "na", "NA", "N/A"):
        return None
    return s


# ---------------------------------------------------------------------------
# Upsert: record_id match → update; else insert
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
    record_id = f"PA-{sr_no:03d}"
    try:
        res = (
            sb.table("dggi_provisional_attachment_records")
            .select("id,record_id")
            .eq("workspace_id", workspace_id)
            .eq("record_id", record_id)
            .execute()
        )
        if res.data:
            row = res.data[0]
            if dry_run:
                print(f"    → UPDATE  existing record_id={record_id!r}  db_id={row['id']}")
            else:
                sb.table("dggi_provisional_attachment_records").update(payload).eq("id", row["id"]).execute()
            log.append({"action": "update", "sr_no": sr_no, "record_id": record_id, "db_id": row["id"], "person_name": payload.get("person_name")})
            return "updated"

        insert_payload = {**payload, "workspace_id": workspace_id, "record_id": record_id}
        if dry_run:
            print(f"    → INSERT  new record_id={record_id!r}")
            inserted_id = None
        else:
            insert_res = sb.table("dggi_provisional_attachment_records").insert(insert_payload).execute()
            inserted_id = insert_res.data[0]["id"] if insert_res.data else None
        log.append({"action": "insert", "sr_no": sr_no, "record_id": record_id, "db_id": inserted_id, "person_name": payload.get("person_name")})
        return "inserted"

    except Exception as e:
        skipped.append({"sr_no": sr_no, "record_id": record_id, "reason": str(e)})
        return "skipped"


# ---------------------------------------------------------------------------
# Sheet processor
# ---------------------------------------------------------------------------

def process_sheet(ws, sb, workspace_id: str, skipped: list, log: list, dry_run: bool = False):
    rows = list(ws.iter_rows(values_only=True))
    inserted = updated = skipped_count = 0

    for row in rows[7:]:  # rows 0-6 are title/headers/sub-headers/col-numbers
        if row[0] is None:
            continue
        try:
            sr_no = int(row[0])
        except (ValueError, TypeError):
            continue

        taxpayer_name = balance_parens(clean(row[2])) if clean(row[2]) else None
        if not taxpayer_name:
            continue

        if dry_run:
            print(
                f"  [#{sr_no:03d}] {taxpayer_name[:50]!r}"
                f" | gstin={clean(row[3])}"
                f" | date={parse_date(row[28])}"
            )

        payload = {
            "person_name": taxpayer_name,
            "gstin_pan": clean(row[3]),
            "person_status": clean(row[4]),
            "expected_liability": clean_amount(row[5]),
            "entity_gstin": clean(row[6]),
            "issue_involved": clean(row[7]),
            "brief_description": clean(row[8]),
            "dossier_prepared": clean(row[10]),
            "value_immovable": clean_amount(row[11]),
            "value_movable": clean_amount(row[12]),
            "value_shares": clean_amount(row[13]),
            "value_bank": clean_amount(row[14]),
            "value_third_party": clean_amount(row[15]),
            "value_others": clean_amount(row[16]),
            "value_total": clean_amount(row[17]),
            "balance_0_3m": clean(row[18]),
            "balance_3_6m": clean(row[19]),
            "balance_6_9m": clean(row[20]),
            "balance_9_12m": clean(row[21]),
            "investigation_completed": clean(row[22]),
            "scn_issued": clean(row[23]),
            "letter_issued": clean(row[24]),
            "oio_issued": clean(row[25]),
            "permanent_attachment": clean(row[26]),
            "group_sio": clean(row[27]),
            "date_of_attachment": parse_date(row[28]),
        }
        payload = {k: v for k, v in payload.items() if v is not None}

        result = upsert_record(sb, workspace_id, sr_no, payload, skipped, log, dry_run)
        if result == "inserted":
            inserted += 1
        elif result == "updated":
            updated += 1
        else:
            skipped_count += 1

    print(
        f"\n[Provisional Attachments]  {'Would insert' if dry_run else 'Inserted'}: {inserted}"
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

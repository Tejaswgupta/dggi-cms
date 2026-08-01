"""
Temporary one-shot patch: set ir_number = '67/GST/2025-26 alphaneon techsolutions'
for all dggi_provisional_attachment_records with record_id PA-107 through PA-193
(i.e. sr_no 107 onwards — the last 87 rows in the register).

Usage:
    python3 scripts/patch_provisional_attachment_ir_number.py [--dry-run]
"""

import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

WORKSPACE_OWNER_EMAIL = "ajinkya.k1@gov.in"
LINKED_CASE_ID = "67/GST/2025.26"
SR_START = 107  # inclusive


def main():
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("*** DRY RUN — no changes will be written ***\n")

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

    # Fetch all PA-NNN records with sr_no >= 107; upper-bound at 'PAR' to exclude PAR/NNN/YY-YY records
    rows = (
        sb.table("dggi_provisional_attachment_records")
        .select("id,record_id")
        .eq("workspace_id", workspace_id)
        .gte("record_id", f"PA-{SR_START:03d}")
        .lt("record_id", "PAR")
        .order("record_id")
        .execute()
        .data
    )

    if not rows:
        print("No matching records found.")
        return

    print(f"Found {len(rows)} records to patch (PA-{SR_START:03d} onwards):")
    for r in rows:
        print(f"  {r['record_id']}  (id={r['id']})")

    if dry_run:
        print(f"\nWould set linked_case_id = {LINKED_CASE_ID!r} on {len(rows)} records.")
        return

    # Batch update by id list
    ids = [r["id"] for r in rows]
    updated = 0
    errors = 0
    for row_id in ids:
        try:
            sb.table("dggi_provisional_attachment_records").update(
                {"linked_case_id": LINKED_CASE_ID}
            ).eq("id", row_id).execute()
            updated += 1
        except Exception as e:
            print(f"  ERROR updating id={row_id}: {e}")
            errors += 1

    print(f"\nDone. Updated: {updated} | Errors: {errors}")


if __name__ == "__main__":
    main()

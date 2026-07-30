"""
Strip ' | IR No: ...' suffix from issue_involved in dggi_records where it was
incorrectly appended by an earlier version of ingest_ir_digit_data.py.

Usage:
    python3 scripts/fix_issue_involved_ir_no.py [--dry-run]
"""

import os
import re
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

WORKSPACE_OWNER_EMAIL = "ajinkya.k1@gov.in"

IR_NO_SUFFIX = re.compile(r"\s*\|\s*IR No:.*$")


def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        print("*** DRY RUN — no changes will be written ***\n")

    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    res = sb.table("votum_users").select("workspace_id").eq("email", WORKSPACE_OWNER_EMAIL).limit(1).execute()
    if not res.data:
        raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")
    workspace_id = res.data[0]["workspace_id"]

    # Fetch all dggi_records with is_ir=True that have an IR No suffix
    page_size = 1000
    offset = 0
    to_fix = []
    while True:
        rows = (
            sb.table("dggi_records")
            .select("id,record_id,issue_involved")
            .eq("workspace_id", workspace_id)
            .eq("is_ir", True)
            .like("issue_involved", "% | IR No:%")
            .range(offset, offset + page_size - 1)
            .execute()
        ).data
        to_fix.extend(rows)
        if len(rows) < page_size:
            break
        offset += page_size

    print(f"Found {len(to_fix)} records to fix.\n")

    fixed = 0
    for row in to_fix:
        cleaned = IR_NO_SUFFIX.sub("", row["issue_involved"] or "").strip() or None
        print(f"  {row['record_id']!r}: {row['issue_involved']!r}  →  {cleaned!r}")
        if not dry_run:
            sb.table("dggi_records").update({"issue_involved": cleaned}).eq("id", row["id"]).execute()
            fixed += 1

    if dry_run:
        print(f"\nDry run complete — would fix {len(to_fix)} records.")
    else:
        print(f"\nFixed {fixed} records.")


if __name__ == "__main__":
    main()

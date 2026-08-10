"""
Backfill: set closure_by = NULL where closure_by = '' in dggi_records.

Root cause: the frontend saved empty-string instead of NULL for closure_by
(a select field skipped by nullifyEmpty). The investigation dashboard filters
with .is("closure_by", null), so records with "" were hidden even though they
were open cases.

Usage:
    python3 scripts/backfill_closure_by_null.py [--dry-run]
"""

import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        print("*** DRY RUN — no changes will be written ***\n")

    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    # Find all affected rows across all workspaces
    res = (
        sb.table("dggi_records")
        .select("id, record_id, workspace_id, is_ir")
        .eq("closure_by", "")
        .execute()
    )
    rows = res.data or []

    if not rows:
        print("No records found with closure_by = '' — nothing to fix.")
        return

    print(f"Found {len(rows)} record(s) with closure_by = '':\n")
    for r in rows:
        kind = "IR" if r["is_ir"] else "NON-IR"
        print(f"  {r['record_id']:<25}  [{kind}]  id={r['id']}")

    if dry_run:
        print(f"\nWould update {len(rows)} record(s): closure_by = NULL")
    else:
        ids = [r["id"] for r in rows]
        # Supabase client doesn't support IN on update directly, batch in chunks
        CHUNK = 100
        updated = 0
        for i in range(0, len(ids), CHUNK):
            chunk = ids[i : i + CHUNK]
            sb.table("dggi_records").update({"closure_by": None}).in_("id", chunk).execute()
            updated += len(chunk)
        print(f"\nUpdated {updated} record(s): closure_by set to NULL.")

    print("\nDry run complete — no data written." if dry_run else "\nDone.")


if __name__ == "__main__":
    main()

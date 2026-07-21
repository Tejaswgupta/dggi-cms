"""
Truncate all ingested DGGI data tables for a given workspace.

Tables cleared (in safe order — children before parents):
  1. dggi_prosecution_arrest_records
  2. dggi_arrest_records
  3. dggi_closure_records
  4. dggi_scn_records
  5. dggi_provisional_attachment_records
  6. dggi_records

Usage:
    python3 scripts/cleanup_truncate_tables.py [--dry-run]
    python3 scripts/cleanup_truncate_tables.py --all-workspaces [--dry-run]
"""

import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

WORKSPACE_OWNER_EMAIL = "ajinkya.k1@gov.in"

TABLES = [
    "dggi_prosecution_arrest_records",
    "dggi_arrest_records",
    "dggi_closure_records",
    "dggi_scn_records",
    "dggi_provisional_attachment_records",
    "dggi_records",
]


def truncate_for_workspace(sb, workspace_id: str, dry_run: bool):
    for table in TABLES:
        res = (
            sb.table(table)
            .select("id", count="exact", head=True)
            .eq("workspace_id", workspace_id)
            .execute()
        )
        count = res.count or 0
        if dry_run:
            print(f"  [DRY RUN] would delete {count:>5} rows from {table}")
        else:
            sb.table(table).delete().eq("workspace_id", workspace_id).execute()
            print(f"  Deleted {count:>5} rows from {table}")


def main():
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    all_workspaces = "--all-workspaces" in args

    if dry_run:
        print("*** DRY RUN — no changes will be written ***\n")

    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    if all_workspaces:
        res = sb.table("votum_users").select("workspace_id, email").execute()
        workspace_ids = list({r["workspace_id"] for r in res.data if r.get("workspace_id")})
        print(f"Found {len(workspace_ids)} workspace(s)\n")
    else:
        res = (
            sb.table("votum_users")
            .select("workspace_id")
            .eq("email", WORKSPACE_OWNER_EMAIL)
            .limit(1)
            .execute()
        )
        if not res.data:
            raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")
        workspace_ids = [res.data[0]["workspace_id"]]
        print(f"Workspace: {workspace_ids[0]}\n")

    for workspace_id in workspace_ids:
        print(f"--- workspace: {workspace_id} ---")
        truncate_for_workspace(sb, workspace_id, dry_run)
        print()

    print("Dry run complete — no data written." if dry_run else "Done.")


if __name__ == "__main__":
    main()

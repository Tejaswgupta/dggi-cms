"""
Backfill created_by_name from sio_name for dggi_provisional_attachment_records
where created_by_name is NULL.

Usage:
    python3 scripts/backfill_provisional_attachment_created_by_name.py [--dry-run]
"""

import sys
from supabase import create_client

SUPABASE_URL = "https://zrkvvedwycdcjjheewef.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3Z2ZWR3eWNkY2pqaGVld2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzAxNjg1NCwiZXhwIjoyMDE4NTkyODU0fQ.ZYgzzv6E--3v2un2uN0jXwHnBvCf0EjPJlGoCQwiqKE"

WORKSPACE_OWNER_EMAIL = "ajinkya.k1@gov.in"

PAGE_SIZE = 1000


def main():
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        print("*** DRY RUN — no changes will be written ***\n")

    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    res = sb.table("votum_users").select("workspace_id").eq("email", WORKSPACE_OWNER_EMAIL).limit(1).execute()
    if not res.data:
        raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")
    workspace_id = res.data[0]["workspace_id"]
    print(f"Workspace: {workspace_id}\n")

    # Fetch all rows where created_by_name is NULL and sio_name is not NULL
    offset = 0
    updated = 0
    skipped_no_sio = 0

    while True:
        rows = (
            sb.table("dggi_provisional_attachment_records")
            .select("id,sio_name,record_id")
            .eq("workspace_id", workspace_id)
            .is_("created_by_name", None)
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        if not rows.data:
            break

        for row in rows.data:
            sio_name = (row.get("sio_name") or "").strip() or None
            rid = row.get("record_id") or row["id"]

            if not sio_name:
                skipped_no_sio += 1
                print(f"  SKIP (no sio_name): {rid}")
                continue

            if dry_run:
                print(f"  [DRY] {rid} → created_by_name = {sio_name!r}")
            else:
                sb.table("dggi_provisional_attachment_records").update(
                    {"created_by_name": sio_name}
                ).eq("id", row["id"]).execute()
                print(f"  ✓ {rid} → {sio_name!r}")

            updated += 1

        if len(rows.data) < PAGE_SIZE:
            break
        offset += PAGE_SIZE

    print(f"\n{'=' * 60}")
    print(f"{'Would update' if dry_run else 'Updated'}: {updated} | Skipped (no sio_name): {skipped_no_sio}")
    print(f"{'=' * 60}")
    print("\nDry run complete — no data written." if dry_run else "\nDone.")


if __name__ == "__main__":
    main()

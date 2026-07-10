"""
Delete the 6 dummy DD users seeded by seed_dd_users.py for a given workspace.

Usage:
    python3 scripts/delete_dummy_dd_users.py
"""

from supabase import create_client

SUPABASE_URL = "https://zrkvvedwycdcjjheewef.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3Z2ZWR3eWNkY2pqaGVld2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzAxNjg1NCwiZXhwIjoyMDE4NTkyODU0fQ.ZYgzzv6E--3v2un2uN0jXwHnBvCf0EjPJlGoCQwiqKE"

WORKSPACE_ID = "e27632d5-19dc-49e6-92ec-df9a86567b40"

# Fixed UUIDs from seed_dd_users.py
DUMMY_DD_UUIDS = [
    "6cd4c2a6-d73b-4fae-9960-73e95e06fcc4",  # Group A DD
    "355d61c4-7871-47e8-90de-666635b0a58c",  # Group B DD
    "95ceb59a-4336-4113-a794-6a7ca7e45b64",  # Group C DD
    "1c5317ca-c138-4832-bb88-47761dba7272",  # Group D DD
    "38bc18d6-cd1f-49ce-856c-80534c74ccc4",  # Group E DD
    "240be28e-b71e-48e6-93d9-f8c30621c0b0",  # DD Unassigned
]


def main():
    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    print(f"── Deleting {len(DUMMY_DD_UUIDS)} dummy DD users ──")
    deleted = 0
    skipped = 0

    for uid in DUMMY_DD_UUIDS:
        # Remove group assignments first (FK constraint)
        sb.table("dggi_user_group_assignments").delete().eq("user_id", uid).execute()
        # Remove votum_users row
        sb.table("votum_users").delete().eq("id", uid).execute()
        # Delete auth user
        try:
            sb.auth.admin.delete_user(uid)
            print(f"  deleted  : {uid}")
            deleted += 1
        except Exception as e:
            msg = str(e)
            if "not found" in msg.lower() or "does not exist" in msg.lower():
                print(f"  not found: {uid}")
                skipped += 1
            else:
                raise

    print(f"\n  → {deleted} deleted, {skipped} already absent\n")
    print("Done.")


if __name__ == "__main__":
    main()

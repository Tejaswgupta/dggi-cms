"""
Seed 5 SIO users per group (Group A–E) = 25 total in ajinkya@gov.in's workspace.

Usage:
    python3 scripts/seed_sio_users.py
"""

import uuid
from supabase import create_client

SUPABASE_URL = "https://zrkvvedwycdcjjheewef.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3Z2ZWR3eWNkY2pqaGVld2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzAxNjg1NCwiZXhwIjoyMDE4NTkyODU0fQ.ZYgzzv6E--3v2un2uN0jXwHnBvCf0EjPJlGoCQwiqKE"

WORKSPACE_OWNER_EMAIL = "ajinkya@gov.in"
DEFAULT_PASSWORD = "Dggi@1234"

GROUPS = ["Group A", "Group B", "Group C", "Group D", "Group E"]

# Pre-generated fixed UUIDs: 5 per group (deterministic, idempotent reruns)
SIO_UUIDS = {
    "Group A": [
        "a1000001-0000-0000-0000-000000000001",
        "a1000001-0000-0000-0000-000000000002",
        "a1000001-0000-0000-0000-000000000003",
        "a1000001-0000-0000-0000-000000000004",
        "a1000001-0000-0000-0000-000000000005",
    ],
    "Group B": [
        "b2000002-0000-0000-0000-000000000001",
        "b2000002-0000-0000-0000-000000000002",
        "b2000002-0000-0000-0000-000000000003",
        "b2000002-0000-0000-0000-000000000004",
        "b2000002-0000-0000-0000-000000000005",
    ],
    "Group C": [
        "c3000003-0000-0000-0000-000000000001",
        "c3000003-0000-0000-0000-000000000002",
        "c3000003-0000-0000-0000-000000000003",
        "c3000003-0000-0000-0000-000000000004",
        "c3000003-0000-0000-0000-000000000005",
    ],
    "Group D": [
        "d4000004-0000-0000-0000-000000000001",
        "d4000004-0000-0000-0000-000000000002",
        "d4000004-0000-0000-0000-000000000003",
        "d4000004-0000-0000-0000-000000000004",
        "d4000004-0000-0000-0000-000000000005",
    ],
    "Group E": [
        "e5000005-0000-0000-0000-000000000001",
        "e5000005-0000-0000-0000-000000000002",
        "e5000005-0000-0000-0000-000000000003",
        "e5000005-0000-0000-0000-000000000004",
        "e5000005-0000-0000-0000-000000000005",
    ],
}


def group_slug(group: str) -> str:
    return group.lower().replace(" ", "-")


def main():
    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    res = sb.table("votum_users").select("workspace_id").eq("email", WORKSPACE_OWNER_EMAIL).limit(1).execute()
    if not res.data:
        raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")
    workspace_id = res.data[0]["workspace_id"]
    print(f"Workspace: {workspace_id}\n")

    for group in GROUPS:
        print(f"── {group} ──")
        for idx, uid in enumerate(SIO_UUIDS[group], start=1):
            slug = group_slug(group)
            name = f"{group} SIO {idx}"
            email = f"{slug}-sio-{idx}@dggi.gov.in"

            # 1. Create auth user
            try:
                sb.auth.admin.create_user({
                    "id": uid,
                    "email": email,
                    "password": DEFAULT_PASSWORD,
                    "email_confirm": True,
                    "user_metadata": {"name": name, "workspace_id": workspace_id},
                })
                print(f"  created  : {email}")
            except Exception as e:
                msg = str(e)
                if "already been registered" in msg or "already exists" in msg or "duplicate" in msg.lower():
                    print(f"  exists   : {email}")
                else:
                    raise

            # 2. Upsert votum_users
            sb.table("votum_users").upsert({
                "id": uid,
                "email": email,
                "name": name,
                "workspace_id": workspace_id,
                "role": "user",
                "dggi_role": "SIO",
            }, on_conflict="id").execute()

            # 3. Assign group
            sb.table("dggi_user_group_assignments").upsert({
                "id": str(uuid.uuid4()),
                "user_id": uid,
                "group_name": group,
                "workspace_id": workspace_id,
            }, on_conflict="user_id,group_name").execute()

        print()

    print("Done — 25 SIO users seeded across 5 groups.")


if __name__ == "__main__":
    main()

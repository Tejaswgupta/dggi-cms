"""
Seed 6 DD users (one per Group A-E + one unassigned) in ajinkya@gov.in's workspace.
Uses fixed UUIDs so this script is idempotent.

Usage:
    python3 scripts/seed_dd_users.py
"""

import os
import uuid
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

WORKSPACE_OWNER_EMAIL = "ajinkya@gov.in"
DEFAULT_PASSWORD = "Dggi@1234"

# Fixed UUIDs — one per group + one unassigned
DD_USERS = [
    {"id": "6cd4c2a6-d73b-4fae-9960-73e95e06fcc4", "name": "Group A DD", "email": "group-a-dd@dggi.gov.in", "group": "Group A"},
    {"id": "355d61c4-7871-47e8-90de-666635b0a58c", "name": "Group B DD", "email": "group-b-dd@dggi.gov.in", "group": "Group B"},
    {"id": "95ceb59a-4336-4113-a794-6a7ca7e45b64", "name": "Group C DD", "email": "group-c-dd@dggi.gov.in", "group": "Group C"},
    {"id": "1c5317ca-c138-4832-bb88-47761dba7272", "name": "Group D DD", "email": "group-d-dd@dggi.gov.in", "group": "Group D"},
    {"id": "38bc18d6-cd1f-49ce-856c-80534c74ccc4", "name": "Group E DD", "email": "group-e-dd@dggi.gov.in", "group": "Group E"},
    {"id": "240be28e-b71e-48e6-93d9-f8c30621c0b0", "name": "DD Unassigned", "email": "dd-unassigned@dggi.gov.in", "group": None},
]


def main():
    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    # Resolve workspace_id from the owner's row
    res = sb.table("votum_users").select("workspace_id").eq("email", WORKSPACE_OWNER_EMAIL).limit(1).execute()
    if not res.data:
        raise SystemExit(f"No user found for {WORKSPACE_OWNER_EMAIL}")
    workspace_id = res.data[0]["workspace_id"]
    print(f"Workspace: {workspace_id}\n")

    for dd in DD_USERS:
        uid = dd["id"]
        email = dd["email"]
        name = dd["name"]
        group = dd["group"]

        # 1. Create auth user (skip if already exists)
        try:
            sb.auth.admin.create_user({
                "id": uid,
                "email": email,
                "password": DEFAULT_PASSWORD,
                "email_confirm": True,
                "user_metadata": {"name": name, "workspace_id": workspace_id},
            })
            print(f"  auth.user created : {email}")
        except Exception as e:
            msg = str(e)
            if "already been registered" in msg or "already exists" in msg or "duplicate" in msg.lower():
                print(f"  auth.user exists  : {email}")
            else:
                raise

        # 2. Upsert votum_users row
        sb.table("votum_users").upsert({
            "id": uid,
            "email": email,
            "name": name,
            "workspace_id": workspace_id,
            "role": "user",
            "dggi_role": "DD",
        }, on_conflict="id").execute()
        print(f"  votum_user upserted: {name}")

        # 3. Assign to group (if applicable)
        if group:
            sb.table("dggi_user_group_assignments").upsert({
                "id": str(uuid.uuid4()),
                "user_id": uid,
                "group_name": group,
                "workspace_id": workspace_id,
            }, on_conflict="user_id,group_name").execute()
            print(f"  group assigned     : {group}")

        print()

    print("Done — 6 DD users seeded.")


if __name__ == "__main__":
    main()

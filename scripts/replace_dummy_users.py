"""
Delete the 25 dummy SIO users seeded by seed_sio_users.py for a given workspace,
then create the real users from the Excel upload template.

Usage:
    python3 scripts/replace_dummy_users.py
"""

import uuid
import openpyxl
from supabase import create_client

SUPABASE_URL = "https://zrkvvedwycdcjjheewef.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3Z2ZWR3eWNkY2pqaGVld2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzAxNjg1NCwiZXhwIjoyMDE4NTkyODU0fQ.ZYgzzv6E--3v2un2uN0jXwHnBvCf0EjPJlGoCQwiqKE"

WORKSPACE_ID = "e27632d5-19dc-49e6-92ec-df9a86567b40"
EXCEL_PATH = "/Users/tejaswgupta/Downloads/user_upload_template (1).xlsx"

# Excel label → DB dggi_role value
ROLE_MAP = {
    "ADD": "ADC",  # Additional Director (Excel) → ADC in DB
    "AD":  "DD",   # AD → DD
    "JD":  "ADC",  # JD → ADC
    "ADG": "ADG",
    "DD":  "DD",
    "SIO": "SIO",
    "IO":  "IO",
    "ADC": "ADC",
}

# Fixed UUIDs from seed_sio_users.py — deterministic, safe to hard-code
DUMMY_UUIDS = [
    "a1000001-0000-0000-0000-000000000001",
    "a1000001-0000-0000-0000-000000000002",
    "a1000001-0000-0000-0000-000000000003",
    "a1000001-0000-0000-0000-000000000004",
    "a1000001-0000-0000-0000-000000000005",
    "b2000002-0000-0000-0000-000000000001",
    "b2000002-0000-0000-0000-000000000002",
    "b2000002-0000-0000-0000-000000000003",
    "b2000002-0000-0000-0000-000000000004",
    "b2000002-0000-0000-0000-000000000005",
    "c3000003-0000-0000-0000-000000000001",
    "c3000003-0000-0000-0000-000000000002",
    "c3000003-0000-0000-0000-000000000003",
    "c3000003-0000-0000-0000-000000000004",
    "c3000003-0000-0000-0000-000000000005",
    "d4000004-0000-0000-0000-000000000001",
    "d4000004-0000-0000-0000-000000000002",
    "d4000004-0000-0000-0000-000000000003",
    "d4000004-0000-0000-0000-000000000004",
    "d4000004-0000-0000-0000-000000000005",
    "e5000005-0000-0000-0000-000000000001",
    "e5000005-0000-0000-0000-000000000002",
    "e5000005-0000-0000-0000-000000000003",
    "e5000005-0000-0000-0000-000000000004",
    "e5000005-0000-0000-0000-000000000005",
]


def load_users_from_excel(path: str) -> list[dict]:
    """Parse the Users sheet; returns list of {name, email, password, dggi_role, group}."""
    wb = openpyxl.load_workbook(path)
    ws = wb["Users"]
    rows = list(ws.iter_rows(values_only=True))
    # Row 0: header note, Row 1: column labels, Row 2: descriptions, Rows 3+: data
    users = []
    for row in rows[3:]:
        name, email, password, dggi_role, group = row
        if not name or not email or not dggi_role:
            continue
        users.append({
            "name": str(name).strip(),
            "email": str(email).strip(),
            "password": str(password).strip() if password else "Dggi@1234",
            "dggi_role": str(dggi_role).strip(),
            "group": str(group).strip() if group else None,
        })
    return users


def delete_dummy_users(sb):
    print("── Deleting dummy seed users ──")
    deleted = 0
    skipped = 0
    for uid in DUMMY_UUIDS:
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
    print(f"  → {deleted} deleted, {skipped} already absent\n")


def create_real_users(sb, users: list[dict]):
    print("── Creating real users ──")
    # Deduplicate by email for auth/votum_users creation; collect all group assignments
    seen_emails: dict[str, str] = {}  # email -> uid

    for u in users:
        email = u["email"]

        if email not in seen_emails:
            uid = str(uuid.uuid4())

            # 1. Create auth user
            try:
                sb.auth.admin.create_user({
                    "id": uid,
                    "email": email,
                    "password": u["password"],
                    "email_confirm": True,
                    "user_metadata": {"name": u["name"], "workspace_id": WORKSPACE_ID},
                })
                print(f"  created  : {email}  ({u['dggi_role']})")
            except Exception as e:
                msg = str(e)
                if "already been registered" in msg or "already exists" in msg or "duplicate" in msg.lower():
                    # Fetch existing UID
                    res = sb.table("votum_users").select("id").eq("email", email).eq("workspace_id", WORKSPACE_ID).limit(1).execute()
                    if res.data:
                        uid = res.data[0]["id"]
                    print(f"  exists   : {email}  (uid={uid})")
                else:
                    raise

            seen_emails[email] = uid

            # 2. Upsert votum_users
            db_role = ROLE_MAP.get(u["dggi_role"], u["dggi_role"])
            sb.table("votum_users").upsert({
                "id": uid,
                "email": email,
                "name": u["name"],
                "workspace_id": WORKSPACE_ID,
                "role": "user",
                "dggi_role": db_role,
            }, on_conflict="id").execute()
        else:
            uid = seen_emails[email]
            print(f"  dup row  : {email} → reusing uid for extra group")

        # 3. Assign group (if present)
        if u["group"]:
            try:
                sb.table("dggi_user_group_assignments").upsert({
                    "id": str(uuid.uuid4()),
                    "user_id": uid,
                    "group_name": u["group"],
                    "workspace_id": WORKSPACE_ID,
                }, on_conflict="user_id,group_name").execute()
                print(f"             └─ group: {u['group']}")
            except Exception as e:
                print(f"             └─ group: {u['group']}  !! FAILED: {e}")

    print(f"\n  → {len(seen_emails)} unique users upserted.\n")


def main():
    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    users = load_users_from_excel(EXCEL_PATH)
    print(f"Loaded {len(users)} rows from Excel ({len({u['email'] for u in users})} unique emails)\n")

    delete_dummy_users(sb)
    create_real_users(sb, users)

    print("Done.")


if __name__ == "__main__":
    main()

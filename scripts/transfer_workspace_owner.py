"""
Transfer workspace ownership from ajinkya@gov.in to ajinkya.k1@gov.in,
then delete all extra users not in the Excel sheet.

Usage:
    python3 scripts/transfer_workspace_owner.py
"""

import openpyxl
from supabase import create_client

SUPABASE_URL = "https://zrkvvedwycdcjjheewef.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3Z2ZWR3eWNkY2pqaGVld2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzAxNjg1NCwiZXhwIjoyMDE4NTkyODU0fQ.ZYgzzv6E--3v2un2uN0jXwHnBvCf0EjPJlGoCQwiqKE"

WORKSPACE_ID = "e27632d5-19dc-49e6-92ec-df9a86567b40"
EXCEL_PATH = "/Users/tejaswgupta/Downloads/user_upload_template (1).xlsx"

OLD_OWNER_EMAIL = "ajinkya@gov.in"
NEW_OWNER_EMAIL = "ajinkya.k1@gov.in"


def load_excel_emails(path: str) -> set[str]:
    """Load all emails from the Excel sheet."""
    wb = openpyxl.load_workbook(path)
    ws = wb["Users"]
    rows = list(ws.iter_rows(values_only=True))
    emails = set()
    for row in rows[3:]:
        name, email, *_ = row
        if not email or not name:
            continue
        emails.add(str(email).strip().lower())
    return emails


def main():
    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    print("── Step 1: Transfer workspace ownership ──")

    # Get old owner ID
    old_res = sb.table("votum_users").select("id").eq("email", OLD_OWNER_EMAIL).eq("workspace_id", WORKSPACE_ID).limit(1).execute()
    if not old_res.data:
        print(f"  ⚠️  Old owner {OLD_OWNER_EMAIL} not found")
        old_owner_id = None
    else:
        old_owner_id = old_res.data[0]["id"]
        print(f"  Old owner: {OLD_OWNER_EMAIL} (id={old_owner_id})")

    # Get new owner ID
    new_res = sb.table("votum_users").select("id").eq("email", NEW_OWNER_EMAIL).eq("workspace_id", WORKSPACE_ID).limit(1).execute()
    if not new_res.data:
        raise SystemExit(f"❌ New owner {NEW_OWNER_EMAIL} not found in workspace!")
    new_owner_id = new_res.data[0]["id"]
    print(f"  New owner: {NEW_OWNER_EMAIL} (id={new_owner_id})")

    # Update new owner to have DD_INT role and enabled modules
    sb.table("votum_users").update({
        "dggi_role": "DD_INT",
        "enabled_modules": ["tasks"]
    }).eq("id", new_owner_id).execute()
    print(f"  ✓ Updated {NEW_OWNER_EMAIL} with DD_INT role and enabled modules\n")

    print("── Step 2: Clean up extra users ──")

    # Load Excel emails
    excel_emails = load_excel_emails(EXCEL_PATH)
    print(f"  Excel sheet: {len(excel_emails)} emails")

    # Query all users in workspace
    res = sb.table("votum_users").select("id, email, name, dggi_role").eq("workspace_id", WORKSPACE_ID).execute()
    db_users = res.data
    print(f"  Database: {len(db_users)} users\n")

    # Find users not in Excel
    to_delete = [u for u in db_users if u["email"].lower() not in excel_emails]

    if not to_delete:
        print("  ✓ No extra users to delete\n")
        return

    print(f"  Deleting {len(to_delete)} extra users:")
    for user in to_delete:
        role = user.get("dggi_role") or "(no role)"
        print(f"    • {user['email']:40s} {role:5s} ({user['name']})")
    print()

    deleted = 0
    for user in to_delete:
        uid = user["id"]
        email = user["email"]

        # Remove all FK references first
        sb.table("dggi_user_group_assignments").delete().eq("user_id", uid).execute()
        sb.table("votum_notifications").delete().eq("created_by_id", uid).execute()
        sb.table("votum_notifications").delete().eq("target_user_id", uid).execute()

        # Nullify task references to this user
        try:
            sb.table("votum_tasks").update({"created_by": None}).eq("created_by", uid).execute()
        except:
            pass
        try:
            sb.table("votum_tasks").update({"last_updated_by": None}).eq("last_updated_by", uid).execute()
        except:
            pass
        try:
            sb.table("votum_tasks").update({"assigned_by": None}).eq("assigned_by", uid).execute()
        except:
            pass

        # Remove other common FK references
        try:
            sb.table("votum_task_assignments").delete().eq("user_id", uid).execute()
        except:
            pass

        try:
            sb.table("task_assignees").delete().eq("user_id", uid).execute()
        except:
            pass

        try:
            sb.table("task_assignees").update({"assigned_by": None}).eq("assigned_by", uid).execute()
        except:
            pass

        try:
            sb.table("dggi_records").update({"handling_io_sio": None}).eq("handling_io_sio", uid).execute()
        except:
            pass

        # Remove votum_users row
        sb.table("votum_users").delete().eq("id", uid).execute()

        # Delete auth user
        try:
            sb.auth.admin.delete_user(uid)
            print(f"    deleted  : {email}")
            deleted += 1
        except Exception as e:
            msg = str(e)
            if "not found" in msg.lower() or "does not exist" in msg.lower():
                print(f"    auth gone: {email}")
                deleted += 1
            else:
                raise

    print(f"\n  → {deleted} users deleted.\n")
    print("Done.")


if __name__ == "__main__":
    main()

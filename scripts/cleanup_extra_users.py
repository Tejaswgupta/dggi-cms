"""
Find and delete users in the workspace that are NOT in the Excel sheet.

Usage:
    python3 scripts/cleanup_extra_users.py
"""

import os
import openpyxl
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

WORKSPACE_ID = "e27632d5-19dc-49e6-92ec-df9a86567b40"
EXCEL_PATH = "/Users/tejaswgupta/Downloads/user_upload_template (1).xlsx"


def load_excel_emails(path: str) -> set[str]:
    """Load all emails from the Excel sheet."""
    wb = openpyxl.load_workbook(path)
    ws = wb["Users"]
    rows = list(ws.iter_rows(values_only=True))
    emails = set()
    for row in rows[3:]:  # Skip header rows
        name, email, password, dggi_role, group = row
        if not email or not name:
            continue
        emails.add(str(email).strip().lower())
    return emails


def main():
    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    # Load emails from Excel
    excel_emails = load_excel_emails(EXCEL_PATH)
    print(f"Excel sheet contains {len(excel_emails)} emails\n")

    # Query all users in workspace
    res = sb.table("votum_users").select("id, email, name").eq("workspace_id", WORKSPACE_ID).execute()
    db_users = res.data

    print(f"Database contains {len(db_users)} users in workspace\n")

    # Find users not in Excel
    to_delete = []
    for user in db_users:
        if user["email"].lower() not in excel_emails:
            to_delete.append(user)

    if not to_delete:
        print("✓ No extra users found — all DB users are in the Excel sheet.")
        return

    print(f"── Found {len(to_delete)} users to delete ──")
    for user in to_delete:
        print(f"  • {user['email']} ({user['name']})")

    print("\nDeleting...\n")

    deleted = 0
    for user in to_delete:
        uid = user["id"]
        email = user["email"]

        # Remove group assignments first
        sb.table("dggi_user_group_assignments").delete().eq("user_id", uid).execute()
        # Remove votum_users row
        sb.table("votum_users").delete().eq("id", uid).execute()
        # Delete auth user
        try:
            sb.auth.admin.delete_user(uid)
            print(f"  deleted  : {email}")
            deleted += 1
        except Exception as e:
            msg = str(e)
            if "not found" in msg.lower() or "does not exist" in msg.lower():
                print(f"  auth gone: {email} (votum_users row removed)")
                deleted += 1
            else:
                raise

    print(f"\n  → {deleted} users deleted.\n")
    print("Done.")


if __name__ == "__main__":
    main()

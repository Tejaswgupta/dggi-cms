"""
Delete users that were bulk-created by create_users_from_csv.py.

Usage:
    python scripts/delete_users_from_csv.py /path/to/users_passwords.csv [--dry-run]

Pass the *_passwords.csv file produced by the create script — it has the
exact list of emails that were created.

For each email it:
  1. Looks up the auth user ID.
  2. Deletes dggi_user_group_assignments rows.
  3. Deletes the votum_users row.
  4. Deletes the auth.users record.

Reads .env from scripts/.env (SUPABASE_URL, SERVICE_ROLE_KEY).
"""

import sys
import os
import csv
import pathlib

def load_env(env_path: str):
    p = pathlib.Path(env_path)
    if not p.exists():
        raise FileNotFoundError(f".env not found at {env_path}")
    for line in p.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        os.environ.setdefault(key.strip(), val.strip())

try:
    import httpx
except ImportError:
    sys.exit("Missing dependency: pip install httpx")

SCRIPT_DIR = pathlib.Path(__file__).parent
load_env(str(SCRIPT_DIR / ".env"))

SUPABASE_URL     = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

HEADERS = {
    "apikey":        SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type":  "application/json",
}


def get_auth_user_id(client: "httpx.Client", email: str) -> str | None:
    resp = client.get(f"{SUPABASE_URL}/auth/v1/admin/users", params={"filter": email})
    resp.raise_for_status()
    for u in resp.json().get("users", []):
        if u.get("email", "").lower() == email.lower():
            return u["id"]
    return None


def delete_group_assignments(client: "httpx.Client", user_id: str):
    resp = client.delete(
        f"{SUPABASE_URL}/rest/v1/dggi_user_group_assignments",
        params={"user_id": f"eq.{user_id}"},
    )
    resp.raise_for_status()


def delete_votum_user(client: "httpx.Client", user_id: str):
    resp = client.delete(
        f"{SUPABASE_URL}/rest/v1/votum_users",
        params={"id": f"eq.{user_id}"},
    )
    resp.raise_for_status()


def delete_auth_user(client: "httpx.Client", user_id: str):
    resp = client.delete(f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}")
    resp.raise_for_status()


def main():
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    paths = [a for a in args if not a.startswith("--")]

    if not paths:
        sys.exit("Usage: python scripts/delete_users_from_csv.py <passwords_csv> [--dry-run]")

    csv_path = paths[0]
    if not pathlib.Path(csv_path).exists():
        sys.exit(f"File not found: {csv_path}")

    emails: list[str] = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            email = (row.get("email") or "").strip().lower()
            if email and "@" in email:
                emails.append(email)

    print(f"Found {len(emails)} users to delete{' (DRY RUN)' if dry_run else ''}.\n")

    ok = skip = err = 0
    with httpx.Client(headers=HEADERS, timeout=30) as client:
        for email in emails:
            try:
                user_id = get_auth_user_id(client, email)
                if not user_id:
                    print(f"  SKIP  {email}: not found in auth")
                    skip += 1
                    continue

                if dry_run:
                    print(f"  DRY   {email}  (id={user_id})")
                    ok += 1
                    continue

                delete_group_assignments(client, user_id)
                delete_votum_user(client, user_id)
                delete_auth_user(client, user_id)
                print(f"  OK    {email}")
                ok += 1
            except Exception as exc:
                print(f"  ERR   {email}: {exc}")
                err += 1

    print(f"\nDone. {ok} deleted, {skip} skipped, {err} errors.")


if __name__ == "__main__":
    main()

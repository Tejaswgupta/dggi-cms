"""
Create dd-int and sio-int users directly without an Excel file.

Usage:
    python scripts/create_int_users.py

Reads .env from scripts/.env (SUPABASE_URL, SERVICE_ROLE_KEY).
"""

import sys
import os
import pathlib

# ---------------------------------------------------------------------------
# Minimal .env loader
# ---------------------------------------------------------------------------

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

USERS_TO_CREATE = [
    {"name": "DD Intelligence",  "email": "dd-int@gov.in",  "password": "Dggi@1234", "dggi_role": "DD_INT"},
    {"name": "SIO Intelligence", "email": "sio-int@gov.in", "password": "Dggi@1234", "dggi_role": "SIO_INT"},
]

# ---------------------------------------------------------------------------
# Helpers (same logic as create_users_from_xlsx.py)
# ---------------------------------------------------------------------------

def get_workspace_id(client: httpx.Client, admin_email: str = "ajinkya@gov.in") -> str:
    resp = client.get(
        f"{SUPABASE_URL}/rest/v1/votum_users",
        params={"select": "workspace_id", "email": f"eq.{admin_email}", "limit": "1"},
    )
    resp.raise_for_status()
    rows = resp.json()
    if not rows:
        raise RuntimeError(f"No workspace found for {admin_email}")
    return rows[0]["workspace_id"]


def get_auth_user_id_by_email(client: httpx.Client, email: str) -> str:
    resp = client.get(f"{SUPABASE_URL}/auth/v1/admin/users", params={"filter": email})
    resp.raise_for_status()
    for u in resp.json().get("users", []):
        if u.get("email", "").lower() == email.lower():
            return u["id"]
    raise RuntimeError(f"Auth user not found for {email}")


def create_auth_user(client: httpx.Client, email: str, password: str, name: str, workspace_id: str) -> str:
    resp = client.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        json={
            "email":         email,
            "password":      password,
            "email_confirm": True,
            "user_metadata": {"name": name, "workspace_id": workspace_id},
        },
    )
    if resp.status_code == 422:
        msg = str(resp.json())
        if any(w in msg.lower() for w in ("already", "duplicate", "registered")):
            return get_auth_user_id_by_email(client, email)
    resp.raise_for_status()
    return resp.json()["id"]


def upsert_votum_user(client: httpx.Client, user_id: str, email: str, name: str,
                      workspace_id: str, dggi_role: str):
    resp = client.post(
        f"{SUPABASE_URL}/rest/v1/votum_users",
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json={
            "id":           user_id,
            "email":        email,
            "name":         name,
            "workspace_id": workspace_id,
            "role":         "user",
            "dggi_role":    dggi_role,
        },
    )
    resp.raise_for_status()

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    with httpx.Client(timeout=30, headers=HEADERS) as client:
        print("Resolving workspace ID …")
        workspace_id = get_workspace_id(client)
        print(f"  workspace_id = {workspace_id}\n")

        for u in USERS_TO_CREATE:
            try:
                uid = create_auth_user(client, u["email"], u["password"], u["name"], workspace_id)
                upsert_votum_user(client, uid, u["email"], u["name"], workspace_id, u["dggi_role"])
                print(f"  OK    {u['email']}  [{u['dggi_role']}]  uid={uid}")
            except Exception as exc:
                print(f"  ERR   {u['email']}: {exc}")

    print("\nDone.")


if __name__ == "__main__":
    main()

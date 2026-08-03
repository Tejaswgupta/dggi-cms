"""
Bulk-create DGGI users from a CSV export.

Usage:
    python scripts/create_users_from_csv.py /path/to/users.csv

CSV columns expected: id, name, email, dggi_role, groups, created_at
  - groups: optional, comma-separated (e.g. "Group A, Group B")
  - password: not in CSV — defaults to Dggi@1234

Reads .env from scripts/.env (SUPABASE_URL, SERVICE_ROLE_KEY).
For each row it:
  1. Creates (or reuses) the "DGGI MZU" workspace in votum_workspace.
  2. Creates the auth.users record via the Admin API (or finds existing).
  3. Upserts a votum_users row.
  4. Inserts dggi_user_group_assignments rows for every group listed.
"""

import sys
import os
import csv
import pathlib
import secrets
import string

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

# ---------------------------------------------------------------------------
# Dependencies check
# ---------------------------------------------------------------------------

try:
    import httpx
except ImportError:
    sys.exit("Missing dependency: pip install httpx")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SCRIPT_DIR = pathlib.Path(__file__).parent
load_env(str(SCRIPT_DIR / ".env"))

SUPABASE_URL     = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

WORKSPACE_NAME    = "DGGI MZU"

_ALPHABET = string.ascii_letters + string.digits + "!@#$%"

def generate_password(length: int = 12) -> str:
    while True:
        pwd = "".join(secrets.choice(_ALPHABET) for _ in range(length))
        if (any(c.isupper() for c in pwd) and any(c.islower() for c in pwd)
                and any(c.isdigit() for c in pwd) and any(c in "!@#$%" for c in pwd)):
            return pwd

VALID_ROLES  = {"SIO", "DD", "ADD", "ADG", "DD_INT", "SIO_INT", "AD", "ADC", "JD", "IO"}
VALID_GROUPS = {"Group A", "Group B", "Group C", "Group D", "Group E", "Group F"}

HEADERS = {
    "apikey":        SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}

# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------

def get_or_create_workspace(client: "httpx.Client", name: str = WORKSPACE_NAME) -> str:
    resp = client.get(
        f"{SUPABASE_URL}/rest/v1/votum_workspace",
        params={"select": "id", "name": f"eq.{name}", "limit": "1"},
    )
    resp.raise_for_status()
    rows = resp.json()
    if rows:
        return rows[0]["id"]

    resp = client.post(
        f"{SUPABASE_URL}/rest/v1/votum_workspace",
        headers={**HEADERS, "Prefer": "return=representation"},
        json={"name": name},
    )
    resp.raise_for_status()
    return resp.json()[0]["id"]


def create_auth_user(client: "httpx.Client", email: str, password: str, name: str, workspace_id: str) -> str:
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
        data = resp.json()
        msg = data.get("msg", "") or data.get("message", "") or str(data)
        if "already" in msg.lower() or "duplicate" in msg.lower() or "registered" in msg.lower():
            return get_auth_user_id_by_email(client, email)
        resp.raise_for_status()
    resp.raise_for_status()
    return resp.json()["id"]


def get_auth_user_id_by_email(client: "httpx.Client", email: str) -> str:
    resp = client.get(f"{SUPABASE_URL}/auth/v1/admin/users", params={"filter": email})
    resp.raise_for_status()
    users = resp.json().get("users", [])
    for u in users:
        if u.get("email", "").lower() == email.lower():
            return u["id"]
    raise RuntimeError(f"Auth user not found for {email}")


def upsert_votum_user(client: "httpx.Client", user_id: str, email: str, name: str,
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


def assign_group(client: "httpx.Client", user_id: str, workspace_id: str, group_name: str):
    resp = client.post(
        f"{SUPABASE_URL}/rest/v1/dggi_user_group_assignments",
        headers={**HEADERS, "Prefer": "resolution=ignore-duplicates,return=minimal"},
        json={
            "user_id":      user_id,
            "group_name":   group_name,
            "workspace_id": workspace_id,
        },
    )
    resp.raise_for_status()

# ---------------------------------------------------------------------------
# CSV parsing
# ---------------------------------------------------------------------------

def parse_csv(path: str) -> list[dict]:
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = (row.get("email") or "").strip().lower()
            if not email or "@" not in email:
                continue

            name  = (row.get("name") or "").strip()
            role  = (row.get("dggi_role") or "").strip().upper()
            raw_groups = (row.get("groups") or "").strip()

            if role not in VALID_ROLES:
                print(f"  SKIP  {email}: unknown role '{role}'")
                continue

            groups = [g.strip() for g in raw_groups.split(",") if g.strip()] if raw_groups else []

            rows.append({
                "name":   name,
                "email":  email,
                "role":   role,
                "groups": groups,
            })
    return rows

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python scripts/create_users_from_csv.py <path_to_csv>")

    csv_path = sys.argv[1]
    if not pathlib.Path(csv_path).exists():
        sys.exit(f"File not found: {csv_path}")

    print(f"Parsing {csv_path} …")
    user_rows = parse_csv(csv_path)
    print(f"Found {len(user_rows)} users to create.\n")

    with httpx.Client(timeout=30) as client:
        client.headers.update(HEADERS)

        print(f"Resolving workspace '{WORKSPACE_NAME}' (creating if absent) …")
        workspace_id = get_or_create_workspace(client)
        print(f"  workspace_id = {workspace_id}\n")

        ok = err = 0
        credentials: list[dict] = []

        for u in user_rows:
            password = generate_password()
            try:
                user_id = create_auth_user(client, u["email"], password,
                                           u["name"], workspace_id)
                upsert_votum_user(client, user_id, u["email"], u["name"],
                                  workspace_id, u["role"])
                for g in u["groups"]:
                    if g in VALID_GROUPS:
                        assign_group(client, user_id, workspace_id, g)
                    else:
                        print(f"  WARN  {u['email']}: unknown group '{g}' — skipped")

                credentials.append({"email": u["email"], "password": password})
                group_str = ", ".join(u["groups"]) if u["groups"] else "—"
                print(f"  OK    {u['email']}  [{u['role']}]  groups: {group_str}")
                ok += 1
            except Exception as exc:
                print(f"  ERR   {u['email']}: {exc}")
                err += 1

    out_path = pathlib.Path(csv_path).with_stem(pathlib.Path(csv_path).stem + "_passwords")
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["email", "password"])
        writer.writeheader()
        writer.writerows(credentials)

    print(f"\nDone. {ok} created/updated, {err} errors.")
    print(f"Credentials saved to {out_path}")


if __name__ == "__main__":
    main()

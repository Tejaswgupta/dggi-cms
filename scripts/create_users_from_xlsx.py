"""
Bulk-create DGGI users from an Excel template.

Usage:
    python scripts/create_users_from_xlsx.py /path/to/user_upload_template.xlsx

Reads .env from scripts/.env (SUPABASE_URL, SERVICE_ROLE_KEY).
For each data row it:
  1. Creates the auth.users record via the Admin API.
  2. Upserts a votum_users row (dggi_role = role from sheet).
  3. Inserts dggi_user_group_assignments rows for every group listed.
"""

import sys
import os
import re
import pathlib

# ---------------------------------------------------------------------------
# Minimal .env loader (no external deps needed)
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
    import openpyxl
except ImportError:
    sys.exit("Missing dependency: pip install openpyxl")

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

VALID_ROLES  = {"SIO", "DD", "ADD", "ADG"}
VALID_GROUPS = {"Group A", "Group B", "Group C", "Group D", "Group E", "Group F"}

# Role normalization: the sheet uses "ADD" but the DB constraint uses "ADD" — confirm mapping
ROLE_MAP = {
    "ADG": "ADG",
    "ADD": "ADD",   # Assistant Deputy Director → maps to ADD in dggi_role CHECK
    "DD":  "DD",
    "SIO": "SIO",
}

HEADERS = {
    "apikey":        SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}

# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------

def get_workspace_id(client: "httpx.Client", admin_email: str = "ajinkya@gov.in") -> str:
    resp = client.get(
        f"{SUPABASE_URL}/rest/v1/votum_users",
        params={"select": "workspace_id", "email": f"eq.{admin_email}", "limit": "1"},
    )
    resp.raise_for_status()
    rows = resp.json()
    if not rows:
        raise RuntimeError(f"No workspace found for {admin_email}")
    return rows[0]["workspace_id"]


def create_auth_user(client: "httpx.Client", email: str, password: str, name: str, workspace_id: str) -> str:
    """Create auth user via Admin API; return the user UUID."""
    resp = client.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        json={
            "email":              email,
            "password":           password,
            "email_confirm":      True,
            "user_metadata": {
                "name":         name,
                "workspace_id": workspace_id,
            },
        },
    )
    if resp.status_code == 422:
        # Likely already exists — look up by email
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
# Excel parsing
# ---------------------------------------------------------------------------

def parse_xlsx(path: str) -> list[dict]:
    wb = openpyxl.load_workbook(path)
    ws = wb["Users"]
    rows = list(ws.iter_rows(values_only=True))

    # Find header row (the one that starts with "Name *")
    header_row_idx = None
    for i, row in enumerate(rows):
        if row and str(row[0]).strip().lower().startswith("name"):
            header_row_idx = i
            break
    if header_row_idx is None:
        raise ValueError("Could not find header row in sheet")

    data = []
    for row in rows[header_row_idx + 1:]:
        if not row or all(v is None for v in row):
            continue
        name, email, password, role, group = row[0], row[1], row[2], row[3], row[4]
        # Skip description/sample rows
        if not email or not str(email).strip() or "@" not in str(email):
            continue
        name     = str(name).strip()
        email    = str(email).strip().lower()
        password = str(password).strip() if password else "Dggi@1234"
        role     = str(role).strip().upper() if role else ""
        group    = str(group).strip() if group else None

        if role not in VALID_ROLES:
            print(f"  SKIP  {email}: unknown role '{role}'")
            continue

        data.append({
            "name":     name,
            "email":    email,
            "password": password,
            "role":     ROLE_MAP[role],
            "group":    group,
        })
    return data


def group_entries_by_email(rows: list[dict]) -> list[dict]:
    """Merge duplicate email rows — collect all groups into a list."""
    seen: dict[str, dict] = {}
    for r in rows:
        email = r["email"]
        if email not in seen:
            seen[email] = {**r, "groups": [r["group"]] if r["group"] else []}
        else:
            if r["group"] and r["group"] not in seen[email]["groups"]:
                seen[email]["groups"].append(r["group"])
    return list(seen.values())

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python scripts/create_users_from_xlsx.py <path_to_xlsx>")

    xlsx_path = sys.argv[1]
    if not pathlib.Path(xlsx_path).exists():
        sys.exit(f"File not found: {xlsx_path}")

    print(f"Parsing {xlsx_path} …")
    raw_rows  = parse_xlsx(xlsx_path)
    user_rows = group_entries_by_email(raw_rows)
    print(f"Found {len(user_rows)} unique users to create.\n")

    with httpx.Client(timeout=30) as client:
        client.headers.update(HEADERS)

        print("Resolving workspace ID …")
        workspace_id = get_workspace_id(client)
        print(f"  workspace_id = {workspace_id}\n")

        ok = err = 0
        for u in user_rows:
            try:
                user_id = create_auth_user(client, u["email"], u["password"],
                                           u["name"], workspace_id)
                upsert_votum_user(client, user_id, u["email"], u["name"],
                                  workspace_id, u["role"])
                for g in u["groups"]:
                    if g in VALID_GROUPS:
                        assign_group(client, user_id, workspace_id, g)
                    else:
                        print(f"  WARN  {u['email']}: unknown group '{g}' — skipped")

                group_str = ", ".join(u["groups"]) if u["groups"] else "—"
                print(f"  OK    {u['email']}  [{u['role']}]  groups: {group_str}")
                ok += 1
            except Exception as exc:
                print(f"  ERR   {u['email']}: {exc}")
                err += 1

    print(f"\nDone. {ok} created/updated, {err} errors.")


if __name__ == "__main__":
    main()

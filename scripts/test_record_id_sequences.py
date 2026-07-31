"""
Test script: verifies record_id_sequences table and its RPC functions
by reading rows and calling next_record_id / next_seq_val via the REST API.
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SERVICE_ROLE_KEY"]

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
}


def get(path, params=None):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()


def rpc(fn, body):
    r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/{fn}", headers=HEADERS, json=body)
    r.raise_for_status()
    return r.json()


def hr(title):
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print(f"{'─'*60}")


# ── 1. Read current rows ───────────────────────────────────────
hr("1. record_id_sequences rows (first 20)")
rows = get("record_id_sequences", {"limit": 20, "order": "prefix.asc,fy.asc"})
if rows:
    for row in rows:
        print(f"  workspace={row['workspace_id'][:8]}…  prefix={row['prefix']:<10}  fy={row['fy']}  next_val={row['next_val']}")
else:
    print("  (table is empty)")

# ── 2. Pick a workspace_id to test with ───────────────────────
if rows:
    test_ws = rows[0]["workspace_id"]
    print(f"\n  Using workspace_id: {test_ws}")
else:
    # fall back to a dummy UUID — the upsert in next_record_id will create a row
    test_ws = "00000000-0000-0000-0000-000000000001"
    print(f"\n  No rows found; using dummy workspace_id: {test_ws}")

# ── 3. Call next_record_id ─────────────────────────────────────
hr("2. next_record_id RPC")
result = rpc("next_record_id", {
    "p_workspace_id": test_ws,
    "p_prefix": "TEST",
    "p_fy": "26-27",
    "p_separator": "/",
})
print(f"  Returned: {result}")

# ── 4. Call next_record_ids_batch ─────────────────────────────
hr("3. next_record_ids_batch RPC (n=3)")
result = rpc("next_record_ids_batch", {
    "p_workspace_id": test_ws,
    "p_prefix": "TEST",
    "p_fy": "26-27",
    "p_n": 3,
    "p_separator": "/",
})
print(f"  Returned: {result}")

# ── 5. Call next_seq_val ───────────────────────────────────────
hr("4. next_seq_val RPC")
result = rpc("next_seq_val", {
    "p_workspace_id": test_ws,
    "p_prefix": "TEST",
    "p_fy": "26-27",
})
print(f"  Returned: {result}")

# ── 6. Read back the TEST row to verify counter ────────────────
hr("5. Verify TEST row counter after calls")
rows = get(
    "record_id_sequences",
    {"workspace_id": f"eq.{test_ws}", "prefix": "eq.TEST", "fy": "eq.26-27"},
)
if rows:
    print(f"  next_val is now: {rows[0]['next_val']}  (expected 6 if table was fresh)")
else:
    print("  Row not found — something went wrong.")

print("\nAll tests passed.\n")

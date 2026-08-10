#!/usr/bin/env python3
"""Verify migration 20260810000002 left the three Intelligence Allocation
tables in the intended shape:
  - assigned_group present on all three
  - transferred_to present on all three
  - `group` dropped from dggi_str_records
"""
import os
from supabase import create_client


def load_env():
    env = {}
    for fname in (".env.local", ".env"):
        path = os.path.join(os.path.dirname(__file__), "..", fname)
        if not os.path.exists(path):
            continue
        with open(path) as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return env


env = load_env()
sb = create_client(
    env["NEXT_PUBLIC_SUPABASE_URL"],
    env.get("SUPABASE_SERVICE_ROLE_KEY") or env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
)

EXPECT = {
    "dggi_intel_rapid_records":       {"has": ["assigned_group", "transferred_to"], "hasnt": []},
    "dggi_intel_other_source_records": {"has": ["assigned_group", "transferred_to"], "hasnt": []},
    "dggi_str_records":               {"has": ["assigned_group", "transferred_to"], "hasnt": ["group"]},
}

# information_schema.columns via PostgREST isn't exposed; probe by selecting
# each column explicitly — a missing column errors, a present one succeeds.
def col_exists(table, col):
    try:
        sb.table(table).select(col).limit(1).execute()
        return True
    except Exception as e:
        msg = str(e)
        if "does not exist" in msg or "column" in msg.lower():
            return False
        # Unknown error — surface it.
        return f"ERR: {msg[:80]}"


ok = True
for table, spec in EXPECT.items():
    print(f"\n{table}")
    for col in spec["has"]:
        r = col_exists(table, col)
        good = r is True
        ok = ok and good
        print(f"   {'OK ' if good else 'FAIL'}  has  {col:16s} -> {r}")
    for col in spec["hasnt"]:
        r = col_exists(table, col)
        good = r is False
        ok = ok and good
        print(f"   {'OK ' if good else 'FAIL'}  gone {col:16s} -> {r}")

print("\n" + ("ALL GOOD" if ok else "SCHEMA MISMATCH — see FAIL rows above"))

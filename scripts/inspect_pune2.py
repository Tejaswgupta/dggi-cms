#!/usr/bin/env python3
"""Pinpoint the arrest-record source of 'Pune Regional Unit' and audit all
group columns for non-canonical values across every RBAC-grouped table."""
import os
import sys
from collections import Counter

from supabase import create_client

CANONICAL = {"Group A", "Group B", "Group C", "Group D", "Group E", "Group F"}


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

# 1. The specific arrest row flagged in dggi_computed_deadlines.
print("=" * 70)
print("1. The offending arrest record")
print("=" * 70)
row = sb.table("dggi_prosecution_arrest_records").select("*").eq(
    "id", "f49374d9-85d8-414a-aa90-8cb18cc150da"
).execute().data
for r in row:
    for k in ("id", "record_id", "arrested_person_name", "entity_name",
              "group", "sio", "workspace_id"):
        print(f"    {k:22s} = {r.get(k)!r}")

# 2. Every group column value across the RBAC tables — flag non-canonical.
print("\n" + "=" * 70)
print("2. Non-canonical group values per table/column")
print("=" * 70)
tables = {
    "dggi_prosecution_arrest_records": "group",
    "dggi_prosecution_non_arrest_records": "group",
    "dggi_provisional_attachment_records": "group",
    "dggi_scn_records": "group",
    "dggi_records": "group",
    "dggi_dfl_records": "group",
    "dggi_seizure_records": "group",
    "dggi_intel_rapid_records": "assigned_group",
    "dggi_str_records": "assigned_group",
}
for table, col in tables.items():
    try:
        data = sb.table(table).select(f"id,{col}").execute().data
    except Exception as e:
        print(f"\n  {table}.{col}: query failed: {e}")
        continue
    vals = [r.get(col) for r in data if r.get(col)]
    noncanon = Counter(v for v in vals if v not in CANONICAL)
    print(f"\n  {table}.{col}  ({len(data)} rows, {len(vals)} non-empty)")
    if noncanon:
        for v, n in noncanon.most_common():
            print(f"      {n:4d}  {v!r}  <-- NON-CANONICAL")
    else:
        print("      all canonical (Group A-F) or empty")

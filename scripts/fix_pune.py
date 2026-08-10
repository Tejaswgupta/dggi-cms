#!/usr/bin/env python3
"""Clear the invalid 'Pune Regional Unit' group.

Fixes BOTH:
  - the source row in dggi_prosecution_arrest_records (so it stays clean on
    the next deadline sync), and
  - the already-computed rows in dggi_computed_deadlines (so the dashboard is
    correct immediately, without needing the sync server running).
"""
import os
from supabase import create_client

BAD = "Pune Regional Unit"
ARREST_ROW_ID = "f49374d9-85d8-414a-aa90-8cb18cc150da"


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

# 1. Source row.
before = sb.table("dggi_prosecution_arrest_records").select(
    "id,record_id,group"
).eq("id", ARREST_ROW_ID).execute().data
print("source before:", before)

sb.table("dggi_prosecution_arrest_records").update(
    {"group": None}
).eq("id", ARREST_ROW_ID).execute()

after = sb.table("dggi_prosecution_arrest_records").select(
    "id,record_id,group"
).eq("id", ARREST_ROW_ID).execute().data
print("source after: ", after)

# 2. Computed-deadline rows (match by the bad value, defensively).
cd_before = sb.table("dggi_computed_deadlines").select(
    "id,row_id,group_name"
).eq("group_name", BAD).execute().data
print(f"\ncomputed_deadlines rows with {BAD!r}: {len(cd_before)}")

if cd_before:
    sb.table("dggi_computed_deadlines").update(
        {"group_name": None}
    ).eq("group_name", BAD).execute()

cd_after = sb.table("dggi_computed_deadlines").select(
    "id", count="exact"
).eq("group_name", BAD).execute()
print(f"remaining rows with {BAD!r}: {cd_after.count}")
print("\nDone.")

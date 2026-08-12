#!/usr/bin/env python3
"""Find who created ARR/062/26-27 and show full record context."""
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

TARGET = "ARR/062/26-27"

print("=" * 70)
print(f"Records matching record_id = {TARGET!r}")
print("=" * 70)

rows = (
    sb.table("dggi_prosecution_arrest_records")
    .select("*")
    .eq("record_id", TARGET)
    .execute()
    .data
)

if not rows:
    print("  No rows found — trying ilike match…")
    rows = (
        sb.table("dggi_prosecution_arrest_records")
        .select("*")
        .ilike("record_id", f"%062%")
        .execute()
        .data
    )
    if rows:
        print(f"  Found {len(rows)} rows containing '062':")

if not rows:
    print("  Nothing found at all.")
else:
    FIELDS = [
        "id", "record_id", "arrested_person_name", "entity_name",
        "group", "sio", "workspace_id",
        "created_by", "created_by_name", "created_at",
        "updated_at",
    ]
    for r in rows:
        print()
        for k in FIELDS:
            print(f"    {k:22s} = {r.get(k)!r}")

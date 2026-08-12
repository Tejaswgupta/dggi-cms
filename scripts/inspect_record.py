#!/usr/bin/env python3
"""Check created_at for a specific record_id in dggi_records."""
import os, sys

from supabase import create_client

def load_env():
    env = {}
    for fname in (".env.local", ".env"):
        path = os.path.join(os.path.dirname(__file__), "..", fname)
        if not os.path.exists(path): continue
        with open(path) as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line: continue
                k, v = line.split("=", 1)
                env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return env

def main():
    env = load_env()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        print("Missing Supabase URL/key", file=sys.stderr); sys.exit(1)

    sb = create_client(url, key)
    record_id = "83/GST/2026-27"

    rows = sb.table("dggi_records").select(
        "id,record_id,group,created_at,deleted_at,taxpayer_name,is_ir"
    ).eq("record_id", record_id).execute().data

    if not rows:
        print(f"No rows found for record_id={record_id!r}")
        return

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    EDIT_WINDOW_DAYS = 7

    for r in rows:
        created_at = r.get("created_at")
        if created_at:
            created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            age_days = (now - created).total_seconds() / 86400
            within_window = age_days <= EDIT_WINDOW_DAYS
        else:
            created, age_days, within_window = None, None, True

        print(f"id          : {r['id']}")
        print(f"record_id   : {r['record_id']}")
        print(f"group       : {r.get('group')}")
        print(f"is_ir       : {r.get('is_ir')}")
        print(f"taxpayer    : {r.get('taxpayer_name')}")
        print(f"created_at  : {created_at}")
        print(f"age_days    : {age_days:.1f}" if age_days is not None else "age_days    : unknown")
        print(f"edit_window : {'OPEN (≤7 days)' if within_window else 'CLOSED (>7 days) ← edit blocked for DD'}")
        print(f"deleted_at  : {r.get('deleted_at')}")

if __name__ == "__main__":
    main()

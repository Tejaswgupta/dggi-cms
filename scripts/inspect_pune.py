#!/usr/bin/env python3
"""Trace where 'Pune Regional Unit' (or any non-canonical group) lives.

Reads Supabase creds from .env.local / .env. Uses the service-role key to
bypass RLS so we see everything the sync job sees.
"""
import os
import re
import sys
from collections import Counter

from supabase import create_client

CANONICAL_GROUPS = {"Group A", "Group B", "Group C", "Group D", "Group E", "Group F"}


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


def main():
    env = load_env()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        print("Missing Supabase URL/key", file=sys.stderr)
        sys.exit(1)
    sb = create_client(url, key)
    needle = "pune"

    # 1. dggi_computed_deadlines — what the dashboard actually reads.
    print("=" * 70)
    print("1. dggi_computed_deadlines.group_name distribution")
    print("=" * 70)
    rows = sb.table("dggi_computed_deadlines").select(
        "id,source_table,row_id,record_id,group_name,officer_name,updated_at"
    ).execute().data
    gc = Counter((r.get("group_name") or "∅") for r in rows)
    for g, n in gc.most_common():
        flag = "" if g in CANONICAL_GROUPS or g == "∅" else "  <-- NON-CANONICAL"
        print(f"  {n:5d}  {g!r}{flag}")

    hits = [r for r in rows if needle in str(r.get("group_name", "")).lower()]
    print(f"\n  rows with '{needle}' in group_name: {len(hits)}")
    for r in hits[:20]:
        print(f"    src={r['source_table']:32s} row_id={r['row_id']} "
              f"group_name={r['group_name']!r} updated_at={r.get('updated_at')}")

    # also check officer_name — sync falls back to assigned_group there too
    off_hits = [r for r in rows if needle in str(r.get("officer_name", "")).lower()]
    print(f"\n  rows with '{needle}' in officer_name: {len(off_hits)}")
    for r in off_hits[:10]:
        print(f"    src={r['source_table']:32s} officer_name={r['officer_name']!r}")

    # 2. Which source tables/columns still contain the string.
    print("\n" + "=" * 70)
    print("2. Source tables containing the string")
    print("=" * 70)
    candidates = {
        "dggi_str_records": ["assigned_group", "transferred_to", "group", "sio_group"],
        "dggi_intel_rapid_records": ["assigned_group", "transferred_to"],
        "dggi_intel_other_source_records": ["assigned_group", "transferred_to"],
        "dggi_records": ["group"],
    }
    for table, cols in candidates.items():
        try:
            data = sb.table(table).select("*").execute().data
        except Exception as e:
            print(f"  {table}: SELECT * failed: {e}")
            continue
        present_cols = set(data[0].keys()) if data else set()
        missing = [c for c in cols if c not in present_cols]
        print(f"\n  {table}  ({len(data)} rows)")
        print(f"    columns present of interest: "
              f"{[c for c in cols if c in present_cols]}")
        if missing:
            print(f"    columns MISSING (migration not applied?): {missing}")
        for c in cols:
            if c not in present_cols:
                continue
            vals = [str(r.get(c)) for r in data if r.get(c)]
            noncanon = [v for v in vals if c in ("assigned_group", "group")
                        and v not in CANONICAL_GROUPS]
            col_hits = [v for v in vals if needle in v.lower()]
            note = ""
            if col_hits:
                note = f"  '{needle}' hits={len(col_hits)} e.g. {col_hits[:3]}"
            if noncanon:
                note += f"  NON-CANONICAL group vals={sorted(set(noncanon))[:5]}"
            print(f"      {c:16s} non-empty={len(vals):4d}{note}")


if __name__ == "__main__":
    main()

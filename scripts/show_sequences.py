"""
Show current record_id_sequences counter values.

Usage:
    python3 scripts/show_sequences.py
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SERVICE_ROLE_KEY"])

rows = (
    sb.table("record_id_sequences")
    .select("workspace_id, prefix, fy, next_val")
    .order("prefix")
    .order("fy")
    .execute()
    .data
)

print(f"{'PREFIX':<10} {'FY':<10} {'NEXT':>6} {'LAST ISSUED':>12}")
print("-" * 44)
for r in rows:
    print(f"{r['prefix']:<10} {r['fy']:<10} {r['next_val']:>6} {r['next_val'] - 1:>12}")

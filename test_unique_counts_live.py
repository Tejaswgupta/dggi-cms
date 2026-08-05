"""
Live test: fetch dggi_computed_deadlines and compare
trigger counts vs unique case counts (keyed by sourceTable|rowId).
"""

import urllib.request
import json
import os

SUPABASE_URL = "https://zrkvvedwycdcjjheewef.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpya3Z2ZWR3eWNkY2pqaGVld2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMzAxNjg1NCwiZXhwIjoyMDE4NTkyODU0fQ.ZYgzzv6E--3v2un2uN0jXwHnBvCf0EjPJlGoCQwiqKE"

URGENCY_RANK = {"expired": 0, "critical": 1, "warning": 2, "safe": 3}

from datetime import date, datetime


def fetch_all_deadlines():
    """Paginate through dggi_computed_deadlines (skipped=false)."""
    rows = []
    page = 0
    PAGE = 1000
    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/dggi_computed_deadlines"
            f"?select=rule_id,source_table,record_id,row_id,deadline_date,skipped,critical_days,warning_days"
            f"&skipped=eq.false"
            f"&offset={page * PAGE}&limit={PAGE}"
        )
        req = urllib.request.Request(url, headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Range-Unit": "items",
        })
        with urllib.request.urlopen(req) as resp:
            batch = json.loads(resp.read())
        rows.extend(batch)
        if len(batch) < PAGE:
            break
        page += 1
    return rows


def classify(deadline_date_str, critical_days, warning_days):
    try:
        dl = datetime.fromisoformat(deadline_date_str).date()
    except Exception:
        return None
    today = date.today()
    days = (dl - today).days
    if days < 0:
        return "expired"
    if days <= critical_days:
        return "critical"
    if days <= warning_days:
        return "warning"
    return "safe"


print("Fetching live data from Supabase...")
rows = fetch_all_deadlines()
print(f"Total non-skipped deadline rows: {len(rows)}")

# Trigger counts (one per row)
trigger_counts = {"expired": 0, "critical": 0, "warning": 0, "safe": 0}
# Unique case counts (worst urgency per sourceTable|rowId)
worst = {}

for r in rows:
    urgency = classify(
        r["deadline_date"],
        r.get("critical_days") or 7,
        r.get("warning_days") or 30,
    )
    if urgency is None:
        continue
    trigger_counts[urgency] += 1

    key = f"{r['source_table']}|{r['row_id']}"
    prev = worst.get(key)
    if prev is None or URGENCY_RANK[urgency] < URGENCY_RANK[prev]:
        worst[key] = urgency

unique_counts = {"expired": 0, "critical": 0, "warning": 0, "safe": 0}
for u in worst.values():
    unique_counts[u] += 1

total_triggers = sum(trigger_counts.values())
total_unique   = sum(unique_counts.values())

print(f"\n{'Urgency':<12} {'Triggers':>10} {'Unique Cases':>14}  {'Diff':>8}")
print("-" * 48)
for urgency in ("expired", "critical", "warning", "safe"):
    t = trigger_counts[urgency]
    u = unique_counts[urgency]
    print(f"{urgency:<12} {t:>10} {u:>14}  {t - u:>+8}")
print("-" * 48)
print(f"{'TOTAL':<12} {total_triggers:>10} {total_unique:>14}  {total_triggers - total_unique:>+8}")

print(f"\nDeduplication reduced count by {total_triggers - total_unique} "
      f"({100*(total_triggers-total_unique)/max(total_triggers,1):.1f}%)")

# Spot-check: find a case with multiple deadline rows
from collections import defaultdict
case_rule_map = defaultdict(list)
for r in rows:
    key = f"{r['source_table']}|{r['row_id']}"
    case_rule_map[key].append(r["rule_id"])

multi = {k: v for k, v in case_rule_map.items() if len(v) > 1}
print(f"\nCases with multiple deadline rules: {len(multi)}")
for k, rules in list(multi.items())[:5]:
    table, row_id = k.split("|", 1)
    record_ids = {r["record_id"] for r in rows if r["row_id"] == row_id}
    print(f"  {table} / {list(record_ids)[0] or '—'}")
    for rule in rules:
        print(f"    · {rule}")

# Validate: unique counts should be <= trigger counts per urgency
print("\nValidation:")
all_ok = True
for urgency in ("expired", "critical", "warning", "safe"):
    ok = unique_counts[urgency] <= trigger_counts[urgency]
    all_ok = all_ok and ok
    print(f"  [{'PASS' if ok else 'FAIL'}] unique_{urgency} <= trigger_{urgency}")
print(f"  [{'PASS' if total_unique <= total_triggers else 'FAIL'}] total_unique <= total_triggers")

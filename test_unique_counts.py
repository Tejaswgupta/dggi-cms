"""
Tests for unique case counting in DGGIDashboard.tsx.

Key hierarchy (mirrors caseKey() in the React useMemo):
  1. linkedCaseId  — child records (SCN/prov/arrest) pointing to parent IR
  2. recordId      — own human-readable ID (IR-001, NIR-001), if not "—"
  3. sourceTable|rowId — UUID fallback, always distinct
"""

URGENCY_RANK = {"expired": 0, "critical": 1, "warning": 2, "safe": 3}


def case_key(item):
    if item.get("linkedCaseId"):
        return item["linkedCaseId"]
    if item.get("recordId") and item["recordId"] != "—":
        return item["recordId"]
    return f"{item['sourceTable']}|{item['rowId']}"


def compute_unique_counts(items):
    worst = {}
    for d in items:
        k = case_key(d)
        prev = worst.get(k)
        if prev is None or URGENCY_RANK[d["urgency"]] < URGENCY_RANK[prev]:
            worst[k] = d["urgency"]
    counts = {"expired": 0, "critical": 0, "warning": 0, "safe": 0}
    for u in worst.values():
        counts[u] += 1
    return counts


def test(name, items, expected):
    result = compute_unique_counts(items)
    ok = result == expected
    print(f"[{'PASS' if ok else 'FAIL'}] {name}")
    if not ok:
        print(f"       expected: {expected}")
        print(f"       got:      {result}")


# ── Basic dedup within same table ─────────────────────────────────────────────

test(
    "single case single deadline",
    [{"sourceTable": "dggi_records", "rowId": "u1", "recordId": "IR-001", "linkedCaseId": None, "urgency": "critical"}],
    {"expired": 0, "critical": 1, "warning": 0, "safe": 0},
)

test(
    "one IR two rules — worst wins (critical > warning)",
    [
        {"sourceTable": "dggi_records", "rowId": "u1", "recordId": "NIR-001", "linkedCaseId": None, "urgency": "warning"},
        {"sourceTable": "dggi_records", "rowId": "u1", "recordId": "NIR-001", "linkedCaseId": None, "urgency": "critical"},
    ],
    {"expired": 0, "critical": 1, "warning": 0, "safe": 0},
)

# ── Cross-table grouping via linkedCaseId ─────────────────────────────────────

test(
    "IR + SCN linked to same case — count as 1",
    [
        {"sourceTable": "dggi_records",     "rowId": "u1", "recordId": "IR-093", "linkedCaseId": None,     "urgency": "warning"},
        {"sourceTable": "dggi_scn_records", "rowId": "u2", "recordId": "SCN-01", "linkedCaseId": "IR-093", "urgency": "critical"},
    ],
    {"expired": 0, "critical": 1, "warning": 0, "safe": 0},
)

test(
    "IR + prov. attachment + arrest — count as 1",
    [
        {"sourceTable": "dggi_records",                          "rowId": "u1", "recordId": "IR-093",  "linkedCaseId": None,     "urgency": "safe"},
        {"sourceTable": "dggi_provisional_attachment_records",   "rowId": "u2", "recordId": "PAR-001", "linkedCaseId": "IR-093", "urgency": "warning"},
        {"sourceTable": "dggi_prosecution_arrest_records",       "rowId": "u3", "recordId": "ARR-001", "linkedCaseId": "IR-093", "urgency": "expired"},
    ],
    {"expired": 1, "critical": 0, "warning": 0, "safe": 0},
)

test(
    "two different IRs with their own children — count as 2",
    [
        {"sourceTable": "dggi_records",     "rowId": "u1", "recordId": "IR-001", "linkedCaseId": None,     "urgency": "warning"},
        {"sourceTable": "dggi_scn_records", "rowId": "u2", "recordId": "SCN-01", "linkedCaseId": "IR-001", "urgency": "safe"},
        {"sourceTable": "dggi_records",     "rowId": "u3", "recordId": "IR-002", "linkedCaseId": None,     "urgency": "critical"},
        {"sourceTable": "dggi_scn_records", "rowId": "u4", "recordId": "SCN-02", "linkedCaseId": "IR-002", "urgency": "safe"},
    ],
    {"expired": 0, "critical": 1, "warning": 1, "safe": 0},
)

# ── Fallback: no recordId, no linkedCaseId ────────────────────────────────────

test(
    "two rows with recordId='—' and different rowIds — must stay separate",
    [
        {"sourceTable": "dggi_records", "rowId": "uuid-A", "recordId": "—", "linkedCaseId": None, "urgency": "critical"},
        {"sourceTable": "dggi_records", "rowId": "uuid-B", "recordId": "—", "linkedCaseId": None, "urgency": "warning"},
    ],
    {"expired": 0, "critical": 1, "warning": 1, "safe": 0},
)

# ── Trigger count > unique count ──────────────────────────────────────────────

items_multi = [
    # IR-001 has 3 rules across 3 tables
    {"sourceTable": "dggi_records",                        "rowId": "u1", "recordId": "IR-001", "linkedCaseId": None,     "urgency": "safe"},
    {"sourceTable": "dggi_scn_records",                    "rowId": "u2", "recordId": "SCN-01", "linkedCaseId": "IR-001", "urgency": "warning"},
    {"sourceTable": "dggi_prosecution_arrest_records",     "rowId": "u3", "recordId": "ARR-01", "linkedCaseId": "IR-001", "urgency": "expired"},
    # IR-002 standalone
    {"sourceTable": "dggi_records",                        "rowId": "u4", "recordId": "IR-002", "linkedCaseId": None,     "urgency": "critical"},
    # NIR-001 two rules same table
    {"sourceTable": "dggi_records",                        "rowId": "u5", "recordId": "NIR-001", "linkedCaseId": None,    "urgency": "warning"},
    {"sourceTable": "dggi_records",                        "rowId": "u5", "recordId": "NIR-001", "linkedCaseId": None,    "urgency": "safe"},
]
result = compute_unique_counts(items_multi)
total_triggers = len(items_multi)
total_unique = sum(result.values())
expected = {"expired": 1, "critical": 1, "warning": 1, "safe": 0}
ok = total_unique < total_triggers and result == expected
print(f"[{'PASS' if ok else 'FAIL'}] unique ({total_unique}) < triggers ({total_triggers}), correct distribution")
if not ok:
    print(f"       got: {result}")

test("empty list", [], {"expired": 0, "critical": 0, "warning": 0, "safe": 0})

print("\nDone.")

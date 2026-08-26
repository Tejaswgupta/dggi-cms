# Proposed changes to `deadline-rules.json` (NOT applied)

Source: handwritten "final" IR-lifecycle timeline (2 photos, 2026-08-25), compared against
the live rule engine (`deadline-rules.json` + `src/lib/dggi-deadline-engine.ts`). The
Deadline Rules dialog copy in `DGGIDashboard.tsx` was already updated to describe this full
timeline (documentation only). These are the corresponding changes needed if the engine
should actually *track and alert on* the two new steps below — none of this has been applied
to `deadline-rules.json` or the engine code.

## 1. ADG Approval → Group Allocation (5 days) — BLOCKED, not implementable as JSON-only

Originally proposed with `reference_field: "adg_putup_date"`. **That column is dead** —
verified: it exists only in `schema.sql` DDL (`:6374`, `:6732`) and in this JSON file's
`tableColumns` select-list string. No form field, label, or `.update()`/`.insert()` payload
anywhere in `IntelligenceAllocationComponent.tsx`, `DGGIComponent.tsx`, or
`STRRegisterComponent.tsx` ever writes to it — it is always `null` in production. A rule
keyed off it would silently never fire.

What's actually live for these tables:
- `group_allocation_date` — genuinely written (`IntelligenceAllocationComponent.tsx:1942-1943`,
  `:2000-2001`) when `assigned_group` becomes `"Allocated"`.
- `pr_adg_comments` — a JSON array of `{text, timestamp}` (`AdgCommentThread.tsx`). The latest
  comment's `timestamp` is the *closest* proxy to "date ADG acted," but it's a free-text
  comment log, not a dedicated approval date — any comment (not just an approval) bumps it,
  so using it as a trigger would produce false deadlines.

No `date_of_approval` / `approval_date` / `pr_adg_approval_date` field exists anywhere in the
repo. Two real options, neither is JSON-only:

- **Add a real column**: create `date_of_pr_adg_approval` (or similar) on
  `dggi_intel_rapid_records`/`dggi_str_records`, add a UI action ("Mark as Approved") in
  `IntelligenceAllocationComponent.tsx` that sets it once, then add the JSON rule against that
  new column.
- **Repurpose `pr_adg_comments`**: tag one comment type as "approval" in the UI and have the
  engine parse that specific entry's `timestamp` — more engine-code work, and still requires a
  UI change to distinguish an "approval" comment from a regular one.

Until one of those exists, this rule cannot be added to `deadline-rules.json` in any
meaningful form — the milestone in the handwritten timeline currently has no queryable
trigger date in the system.

## 2. NON-IR Number → 2nd ADG Approval (10 days)

Gap: nothing tracks the time between `date_of_non_ir` and `intel_approved_date`. (The *next*
hop — `intel_approved_date` → `intelligence_action_date`, 10 days — is already covered by
the existing `intel_approved_to_action_deadline` rule; no change needed there.)

Add to the `dggi_records` block:

```json
{
  "rule_id": "non_ir_to_adg_approval_deadline",
  "label": "2nd ADG Approval (10 days from NON-IR number)",
  "legal_reference": "Int. Procedure – NON-IR to ADG Approval",
  "reference_field": "date_of_non_ir",
  "offset_days": 10,
  "reminder_days_before": [10, 5, 3, 1],
  "critical_days": 2,
  "warning_days": 5,
  "skip_if_not_null": ["intel_approved_date"]
}
```

Risk: low. Both columns are confirmed live (not schema-only) — `date_of_non_ir` is written in
`IntelligenceAllocationComponent.tsx:1476,1514,2027` and `DGGIComponent.tsx:3954,4368`;
`intel_approved_date` is written in `IntelligenceAllocationComponent.tsx:1510` and
`DGGIComponent.tsx:3899,3951,4363`.

## 3. Provisional Attachment 1-year warning, clears only at case closure

Gap: no rule exists for this at all. This one is **not** a pure JSON change — the engine's
skip conditions (`skip_if`, `skip_if_not_null`, `skip_if_not_in`, `apply_only_if`) only read
fields on the *same row* (confirmed in `dggi-deadline-engine.ts`). "Clears when the case
closes" means checking `dggi_records.closure_by` via this row's `linked_case_id` — a
cross-table lookup the engine doesn't support today.

**Option A — cheap approximation (JSON-only):**

```json
{
  "rule_id": "provisional_attachment_lapse_warning",
  "label": "Provisional Attachment warning (1 year)",
  "legal_reference": "Sec 83(1) CGST – 1 year lapse",
  "reference_field": "date_of_attachment",
  "offset_days": 365,
  "reminder_days_before": [30, 14, 7],
  "critical_days": 14,
  "warning_days": 35,
  "skip_if_not_null": ["date_of_release"]
}
```
Correct only if "released" and "case closed" are effectively the same event for
provisional attachments in practice — needs confirmation, since the handwritten note is
explicit that it should track *case* closure, not attachment release.

**Option B — correct version (requires engine code change):**
Extend `computeDeadlinesForRecords()` in `src/lib/dggi-deadline-engine.ts` to accept a
cross-table skip lookup: fetch closure status (`closure_by`) for all distinct
`linked_case_id` values referenced by `dggi_provisional_attachment_records`, and skip rows
whose linked case is already closed — in addition to the existing same-row `skip_if_not_null`
checks. This is a small, scoped change but touches the shared engine function used by every
other rule, so it needs its own review/testing pass, not a drive-by edit.

## Summary

| # | Rule | JSON-only? | Risk |
|---|---|---|---|
| 1 | ADG approval → group allocation (5d) | **No** — blocked, trigger column doesn't exist/isn't written | Blocked until a real approval-date column + UI exists |
| 2 | NON-IR number → 2nd ADG approval (10d) | Yes | Low |
| 3 | Provisional attachment 1yr warning, case-closure-aware | No (Option B) / Approximate only (Option A) | Medium — shared engine function |

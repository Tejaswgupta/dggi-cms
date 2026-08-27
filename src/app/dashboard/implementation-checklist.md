# Implementation Checklist — DGGI moat features

What a prompted HTML/Excel dashboard structurally **cannot** do: live state, a clock
that runs on its own, legal chain-of-custody, and cross-record intelligence over the
whole corpus. You already have the engine (`src/lib/dggi-deadline-engine.ts`), the
cache table (`dggi_computed_deadlines`), the cron endpoint
(`src/app/api/dggi/deadline-alerts/route.ts`), and a written gap analysis
(`deadline-rules-proposed-changes.md`). This closes the 3 known gaps and adds the 2
things HTML genuinely can't do. Ordered by statutory-risk-reduced per line of code.

## Phase 1 — Cross-table skip (unblocks provisional-attachment correctness)

- [ ] **Gap #3 Option B — cross-table skip in the engine.**
      `computeDeadlinesForRecords()` only reads same-row fields today. Add an optional
      `crossTableSkip` param: caller passes a `Set<closed_case_id>`, engine skips rows
      whose linked case is closed.
- [ ] Wire in `route.ts`: for `dggi_provisional_attachment_records`, batch-fetch
      `closure_by` by `linked_case_id` (same batch-resolve pattern used for officer
      names), pass the set.
- [ ] Add the 1-year attachment rule keyed off `date_of_attachment`, skipping on a
      closed linked case.
- [ ] Test: closed linked case → no deadline; open → fires at 365d.
- [ ] **Gap #1 stays blocked** — no approval-date column exists. Decide: add
      `date_of_pr_adg_approval` + a "Mark Approved" UI action, or leave it out. Do NOT
      build the `pr_adg_comments`-parsing version — it produces false deadlines.

## Phase 3.5 — Proactive MIS / auto-generated monthly report

Today `MPRComponent.tsx` is a manual tick-box: a human checks off "did we file report
X this month" and exports the list to Excel. It tracks whether someone _remembered_ —
it generates nothing. The moat is a report the system computes and pushes on its own.
This is the clearest "paste-Excel-can't-do-it" feature: numbers roll up server-side
over the full live corpus, and the report fires on a schedule with no human trigger.

- [ ] **Aggregate RPC / SQL view** — one server-side function returning the month's
      MIS numbers by zone × period: IRs opened / closed / pending, SCNs issued vs due,
      prosecution complaints filed, seizures, provisional attachments live, and
      **limitation-breach counts pulled straight from `dggi_computed_deadlines`**
      (critical/warning). No client-side aggregation over pasted rows.
- [ ] **MIS dashboard view for the brass** — read-only roll-up (zone/officer/period)
      built on the RPC. Reuse the table conventions already in the app. Distinct from
      the case-by-case registers officers use.
- [ ] **Auto-generate the monthly report** — endpoint (mirror the
      `deadline-alerts/route.ts` cron pattern: `CRON_SECRET`, admin client) that on the
      1st computes the previous month's numbers and writes a `dggi_monthly_reports` row
      (period, JSONB payload, generated_at). No one has to remember — contrast with
      today's manual `MPRComponent` tick-box.
- [ ] **Push, don't wait** — on generation, notify the brass (reuse
      `NotificationsComponent` / the notifications table) that the report is ready;
      optionally attach the XLSX export (`MPRComponent` already imports `XLSX`).
- [ ] **Keep the manual tracker as reconciliation** — `MPRComponent`'s "filed?"
      toggles stay useful as a check that a statutorily-required _external_ filing
      happened; the auto-report covers the internal numbers. Don't rip it out.
- [ ] Check: run the generator for a fixed test month → row written with correct
      counts; re-run → idempotent (upsert on period, no duplicate).

## Phase 4 — Operational hardening

- [ ] Confirm the cron actually runs daily (pg_cron or external). The engine is dead
      if nothing calls the endpoint.
- [ ] Escalation on `dggi_computed_deadlines`: when `critical_days` is breached,
      notify the supervisor, not just the SIO.

---

Start at Phase 0 — already written, and it builds confidence in the engine before
touching shared code in Phase 1.

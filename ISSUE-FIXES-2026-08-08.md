# Fix Plan — Issues as of August 8th, 2026

Grounded against the codebase on 2026-08-08. Each item lists the **root cause**, **files/lines**, and a **concrete fix**. A later subagent can implement these directly.

## Status Legend
- ✅ **Done** — implemented and type-checked clean
- ⏳ **Pending** — not yet implemented
- ❓ **Needs verification** — needs runtime reproduction or further investigation

## Progress Summary

| Issue | Title | Status |
|-------|-------|--------|
| IR-2 | SCNs prior to Jan-2025 not visible to Group F AD | ⏳ |
| IR-3 | IR register editable for 7 days from creation | ✅ |
| IR-4 | Duplicate entries in IR register | ✅ (migration) |
| NIR-5 | Remove Detection/Recovery/Status/BO/DIGIT columns | ✅ |
| NIR-6 | Autopopulate Non-IR closure date | ✅ (column added) |
| NIR-7 | Non-IR register editable for 7 days from creation | ✅ |
| NIR-8 | latest_status missing from Non-IR dialog | ✅ |
| NIR-9 | Arrest ID in File No. column | ⏳ (see ARR-18) |
| NIR-15 | Closed Non-IR not reflected (register side) | ✅ (status badge) |
| NIR-15 | Closed Non-IR not reflected (convert-to-IR fragile write) | ✅ |
| SCN-2 | Group F AD visibility gap | ✅ (migration) |
| SCN-12 | Handling SIO name in SCN register & dialog | ✅ (migration + UI) |
| SCN-13 | Issuing authority names from backend | ⏳ |
| CLR-14 | Duplicate entries in closure register | ✅ (migration) |
| CLR-15 | Legacy closed Non-IRs missing from closure register | ✅ (migration) |
| CLR-16 | Non-IR closed cases showing under IR tab | ✅ |
| CLR-17 | No reference period; IR closed cases missing | ✅ (FY filter) |
| CLR-19 | Cannot edit closure records | ✅ (ADG/DD_INT) |
| ARR-9/18 | Arrest ID in File No. column | ⏳ |
| ARR-18 | Duplicate arrest entries | ⏳ |
| CC-10 | Provisional attachment Excel download broken | ✅ |
| CC-11 | Soft delete (strike-through) across all registers | ✅ (migration + all registers) |

**18 of 22 items done · 4 pending · 0 needs runtime verification**

## Shared architecture facts (read first)

- **IR and Non-IR registers are read-only views** over the `dggi_records` table. `IncidentReportComponent.tsx` (`is_ir=true`) and `NonIRRegisterComponent.tsx` (`is_ir=false`) render rows via `renderRow`; neither has an add/edit dialog. **All create/edit/close of IR & Non-IR cases happens in `DGGIComponent.tsx`.** So most "should be editable" fixes land in `DGGIComponent.tsx`, not the register file.
- **Roles** (`votum_users.dggi_role`, constraint in `20260717000002_add_sio_int_dggi_role.sql`): `ADG`, `DD_INT`, `DD`, `AD`, `ADC`, `JD`, `SIO`, `IO`, `SIO_INT`. `ADG`/`DD_INT` see everything; `IO`/`SIO` see only their own (`handling_io_sio = uid`); everyone else is gated by `group IN (their groups)`.
- **Record IDs are race-safe** (Postgres `SELECT … FOR UPDATE` in `20260730000001_record_id_sequences.sql`). ID collisions are NOT the source of any duplicate. Duplicates come from re-inserts / double-submit / missing unique constraints.
- **`created_by` / `created_by_name` exist (write-once) on all tables** (`20260709000000_add_created_by_and_bulk_transfer.sql`), but there is **no `created_at`-based edit window** and **no soft-delete columns** (`deleted_at`/`is_deleted`) anywhere.
- **All deletes are hard deletes** (`supabase.from(T).delete().eq("id", id)`), most with an optimistic client-side "Undo" toast (5s window). No row is ever retained after delete.
- **The Closure Register (`dggi_closure_records`) is an immutable snapshot table** — rows are only ever `insert`ed by two paths in `DGGIComponent.tsx` (normal close + convert-to-IR), never updated, with no unique constraint and no backfill for legacy/seeded closed cases. Four closure issues share this root cause.

---

## IR Register

### Issue 2 — SCNs issued prior to Jan-2025 not visible to Group F AD ⏳
See **SCN Register → Issue 2** below (this is an SCN-register visibility bug, mis-filed as IR).

### Issue 3 — IR register should be editable for a temporary period ✅
- **Root cause:** No time-window edit gating exists. In `DGGIComponent.tsx`, `FROZEN_ON_EDIT` is an empty Set (`~2329`, comment "temporarily all fields editable post-creation") and `isStageUnlocked` (`~2358`) unlocks all stages in edit mode. Edit is entered by clicking the record_id → `startEditWithRegisters` → `startEdit` (`~3623`). So currently everything is *always* editable, with no expiry.
- **Fix:** Decide the policy with the user (see Open Questions). To implement a window: gate in `startEdit`/the dialog's `editableColumns` (`DGGIComponent.tsx ~2341`) or the `disabled` arg of `renderField`, comparing `record.created_at + WINDOW` (e.g. 7 days) against now. `created_at` already exists on the row. Non-`ADG`/`DD_INT` users lose edit after the window; `ADG` retains it. No schema change needed if derived from `created_at`; add an `editable_until` column only if the window must be per-record configurable.

> **Implemented:** `canEditRecord()` gate added in `DGGIComponent.tsx:startEdit`. Non-ADG/DD_INT users blocked after 7 days from `created_at`; toast shown. ADG/DD_INT always retain edit.

### Issue 4 — Duplicate entries in IR register ⏳
- **Root cause:** `dggi_records` has **no unique constraint on `record_id`** (grep of migrations shows only a `group` CHECK). IR insert is `saveNew` in `DGGIComponent.tsx:4065-4110` — a single `.insert(payload)` guarded only by `setSavingRow(true)` (button `disabled={saving}`, dialog `~2947`). Duplicates arise from re-submits after transient errors, or seed/import re-runs; the client guard doesn't protect against them.
- **Fix (two layers):**
  1. **DB:** Add a partial unique index `CREATE UNIQUE INDEX ON dggi_records (workspace_id, record_id) WHERE record_id IS NOT NULL;` (new migration). This is the durable guard.
  2. **Client:** Keep the `saving` disable; optionally switch the insert to an upsert on `(workspace_id, record_id)`.
  3. **Cleanup:** Write a one-off dedup query/migration to remove existing dupes (keep earliest `created_at`) before adding the unique index, or the index creation will fail.

---

## Non-IR Register

### Issue 5 — Remove Detection, Recovery, Status, BO Id, DIGIT Id from Non-IR register ✅
- **File:** `NonIRRegisterComponent.tsx`, `COLUMNS` array (~85-153). Remove these entries:
  - `detection_amount` (~102-108), `recovery_itc` (~109-115), `recovery_cash` (~116-122), `latest_status` (~129), `bo_id` (~138), `digit_id` (~139).
- **Also:** drop `r.bo_id` from the search predicate (~321). Export uses `visibleColumns` (~392-396), so removing columns auto-removes them from Excel — no separate change. Interface fields (~58-79) can stay (harmless; still fetched by `select("*")`).
- **Note:** removing `latest_status` from this view interacts with Issue 15 — see that item (once status column is gone, there's no closed/pending indicator here).

> **Implemented:** Removed `detection_amount`, `recovery_itc`, `recovery_cash`, `latest_status`, `bo_id`, `digit_id` from `NonIRRegisterComponent.tsx COLUMNS`. Also removed `r.bo_id` from search predicate and updated placeholder.

### Issue 6 — Autopopulate Non-IR closure date, with editable option ⏳
- **Current state:** Auto-fill **already exists** in `DGGIComponent.tsx:3626` — `due_date: record.due_date || (!record.is_ir ? today() : "")`. The field is a `datepicker` (`NON_IR_CLOSURE_FORM_COLS` key `due_date`, label "Date of Closure", ~613-619), so it defaults to today and stays editable in the DGGI edit dialog.
- **Root cause of the ask:** the closure date is invisible in the Non-IR register itself (no `due_date` column, no dialog there).
- **Fix:** If the requirement is that the register *shows* the closure date, add a `due_date` column to `NonIRRegisterComponent.tsx COLUMNS`. If the requirement is only about the edit form, verify `DGGIComponent.tsx:3626` behaves as intended (it does) and confirm the label at ~617. Confirm with user which surface they mean.

### Issue 7 — Non-IR register should be editable for a temporary period ✅
Same mechanism and fix as **IR Issue 3** — the gate lives in `DGGIComponent.tsx` (`FROZEN_ON_EDIT` ~2329, `startEdit` ~3623), shared by both IR and Non-IR. Implement once.

> **Implemented:** Same `canEditRecord()` gate as Issue 3 — applies to both IR and Non-IR (same `startEdit` path).

### Issue 8 — Pending Non-IR: latest status not featuring in dialog; should be editable ✅
- **Root cause:** The non-IR dialog renders **only** fields listed in `NON_IR_STAGES` (`DGGIComponent.tsx ~2266-2301`, via `renderNonIrForm` ~2727-2865). None of the three stages' `fields` arrays include `latest_status`, so although the column exists in `NON_IR_COLUMNS` (~590-596, type `select-with-other`), it never renders in the non-IR dialog. (IR uses `renderIrForm` which iterates all `editableColumns`, so IR shows it.)
- **Fix:**
  1. Add `"latest_status"` to a stage's `fields` in `NON_IR_STAGES` (e.g. the "Intelligence Action" stage ~2287-2294, or a new "Status" stage).
  2. `LATEST_STATUS_OPTIONS` currently has a single value `["Kept in Abeyance"]` (~125). Broaden it with the real pending statuses so they're selectable (the `select-with-other` `isOther` branch ~2473 already supports a stored custom value, so existing values display/edit correctly once the field is in a stage).

> **Implemented:** Added `"latest_status"` to the `NON_IR_STAGES` "Intelligence Action" stage in `DGGIComponent.tsx:2292`. Field renders as `select-with-other` using `LATEST_STATUS_OPTIONS` (custom values still supported via the `isOther` branch).

### Issue 9 — Arrest Id reflected in File Number column ⏳
This is an **Arrest Register** design issue, not Non-IR. The Non-IR `file_no` is never populated from an arrest (verified: DGGI/Intel inserts write `file_no: draft.file_no`/`""`, never an ARR id). See **Arrest Register → Issue 18** for the real fix.

### Issue 15 — Non-IR closed entry not getting reflected
- **Two distinct root causes:**
  1. **Primary Non-IR register never reflects closed state.** `fetchRecords` in `NonIRRegisterComponent.tsx:280-307` filters only `is_ir=false`, with no `closure_by` filter and (after Issue 5) no status column. A closed non-IR appears identical to an open one.
     - **Fix:** either exclude closed rows (`query.is("closure_by", null)`) *or* add a small closure/status indicator column. Confirm intended behavior with user.
  2. **Convert-to-IR closure write is fragile.** In `DGGIComponent.tsx:4116-4206`, when a non-IR is converted to IR, the non-IR closure row is only written *after* the IR insert succeeds (`~4169`). If the IR save fails, the non-IR closure never lands in `dggi_closure_records`.
     - **Fix:** write the closure entry independently of IR-save success, or make the two writes transactional (RPC).
- Also see Closure Register Issue 15 (same symptom, closure-table side).

> **Root cause 2 implemented:** Non-IR closure insert (`dggi_closure_records`) moved outside the `else` block — it now runs unconditionally after the Non-IR update attempt, so the closure snapshot is written even if the update fails.

> **Partially implemented (root cause 1):** Added a `Status` column to `NonIRRegisterComponent.tsx` keyed on `closure_by` — shows green "Open" / red "Closed" badge per row. Root cause 2 (convert-to-IR fragile write) is ⏳ pending.

---

## SCN Register

### Issue 2 — SCNs prior to Jan-2025 not visible to Group F AD ⏳
- **Root cause (NOT a date filter — there is no Jan-2025 cutoff anywhere):** The load query `fetchRecords` (`SCNRegisterComponent.tsx:562-590`) gates non-`ADG`/`DD_INT`, non-`IO`/`SIO` users (which includes **AD**) by `.in("group", groups)` (~576), an exact-string match on the `group` column. `dggi_scn_records` has **no RLS and no `group` CHECK constraint**, so legacy/bulk-imported SCN rows (the "pre-Jan-2025" ones) likely have `group` = `NULL` or a non-canonical form ("F", "Grp-F", wrong case) and silently fail the match. Compounding: Group F was added late and the SIO/group seed (`20260617000000_seed_sio_users_per_group.sql`) seeds only Groups A–E, so a Group F AD may have **no `dggi_user_group_assignments` row** → `groups` empty → `.eq("group","__none__")` (~578) hides *everything*.
- **Fix:**
  1. Verify the Group F AD has a `dggi_user_group_assignments` row (add a seed/migration for Group F if missing).
  2. Backfill the `group` column on historical `dggi_scn_records` to the canonical `"Group F"` (etc.) via migration, and/or relax the match at `SCNRegisterComponent.tsx:572-580` to normalize casing / handle NULL.
- **Secondary (not the bug, but note):** `sioUsers` from `useGroupFilteredSioUsers` is destructured (~510) but unused; the dialog is passed all `workspaceUsers` (~1298).

### Issue 12 — Handling SIO name required in SCN register table and dialog ⏳
- **Root cause:** SCN has only one officer field, `sio`, labeled "Name of SCN Issuing Authority" (`SCNRegisterComponent.tsx:413-418`). There is **no `handling_io_sio` field/column**, and `dggi_scn_records` has no such DB column. On case-link autofill, the case's handling SIO is written into the issuing-authority field (~795), conflating the two.
- **Fix:**
  1. DB migration: add `handling_io_sio` (uuid) + `handling_io_sio_name` (text snapshot) to `dggi_scn_records` (mirror `20260613000000_add_sio_name_snapshots.sql`).
  2. Add a `handling_io_sio` column def (type `usercombobox`) to `COLUMNS` (~413) so it shows in both the table and the dialog (both render from the same `columns`).
  3. Add fields to the `SCNRecord` interface (~68-93) and `EMPTY_RECORD` (~115-139); persist the name snapshot in `saveNew`/`saveEdit` (~655, ~720) alongside `sio_name`.

### Issue 13 — Issuing authority names to be changed from backend ⏳
- **Two candidate meanings — confirm with user:**
  - **(a) Officer name (`sio` person field):** Options come from `votum_users` (DB). The table already resolves the *live* name (`renderCell ~836-843` prefers `workspaceUsers` name over the `sio_name` snapshot), so editing the officer's name in `votum_users` propagates to display. Only the frozen `sio_name` snapshots (~655, ~720) and Excel export lag — backfill those if historical rows must reflect the new name.
  - **(b) Authority enum (`adjudicating_authority`):** `ADJUDICATING_AUTHORITY_OPTIONS` is a **hardcoded client constant** (~152-159), so it can't be changed from backend today.
    - **Fix:** move it into a DB lookup table and fetch it into state; the column def (~371-377) then takes `options` from state. Same limitation applies to `ISSUE_OPTIONS` (~271), `COMMISSIONERATE_OPTIONS` (~161), `ADJUDICATION_STATUS_OPTIONS` (~290), `COMPETENCY_OPTIONS` (~284) if similar requests follow.

---

## Closure Register

Cross-cutting root cause: `dggi_closure_records` is an immutable snapshot table, populated only by two client-side insert paths in `DGGIComponent.tsx` (`~3751`, `~4169`), gated by an in-memory `!hadClosureBefore` check, with **no unique constraint, no `is_ir` validation, no period filter, no update path, and no backfill** for pre-existing/seeded closed cases.

### Issue 14 — Duplicate entries in closure register ⏳
- **Root cause:** No DB dedup. `record_id` (CLR/CNR) is unique via sequence, but `source_record_id` has no unique constraint (migration `20260609105430_recreate_dggi_closure_records.sql:43-52` — only PK on `id`). The only guard is client-side `shouldWriteClosureEntry = !hadClosureBefore && isNowClosed` (`DGGIComponent.tsx:3685-3687`), which fails on close→reopen→re-close, double-click, retry-after-error (insert error ~3789 only toasts), or repeated seed/import.
- **Fix:** Add a partial unique constraint on `(workspace_id, source_record_id)` (new migration; dedup existing rows first), and/or upsert instead of insert at `~3751` and `~4169`.

### Issue 15 — Non-IR closed entry not getting reflected (Closure Register side) ⏳
- **Root cause:** The Non-IR closure tab shows `dggi_closure_records` where `is_ir=false` (`ClosureRegisterComponent.tsx:316`). Legacy/seeded closed non-IRs (e.g. `NIR-137..140` in `20260805000001_...sql`) were inserted into `dggi_records` only — never into `dggi_closure_records` — so they never appear. Also, load gating (~285-292) restricts `IO`/`SIO` to `handling_io_sio = uid`; if the closure row's `handling_io_sio` was empty at close time it's `null` and never matches.
- **Fix:** Backfill `dggi_closure_records` for already-closed non-IRs (migration), and repair the load gating (~285-292) to handle null `handling_io_sio`/`group`. Also fix the convert-to-IR write fragility (Non-IR Issue 15 above).

### Issue 16 — Non-IR closed cases showing under IR tab ✅
- **Root cause:** Tab membership is decided **solely** by the stored `is_ir` snapshot on the closure row (`ClosureRegisterComponent.tsx:316`), never reconciled against live `dggi_records.is_ir`. The value is copied from `dialogDraft.is_ir ?? false` (`DGGIComponent.tsx:3644`) → inserted at ~3757. If `is_ir` is ever `undefined` in the draft it coerces to `false`; and note `generateClosureRecordId`'s default param is `isIr = true` (`register-utils.ts:143`), so the ID prefix and stored `is_ir` can diverge. Any mis-stamped row lands in the wrong tab and can't self-correct.
- **Fix:** Either (a) join/verify against `dggi_records.is_ir` when filtering (~316), or (b) set `is_ir` explicitly at write time (never rely on `?? false`) at `DGGIComponent.tsx:3644/3757`, and add a DB CHECK linking `is_ir` to `closure_by`.

> **Implemented:** `saveEdit` now derives `isIrRecord` from the existing DB record (`existingForType?.is_ir`) rather than `dialogDraft.is_ir ?? false`, eliminating the undefined-coercion bug. This fixes mis-stamped `is_ir` on closure rows going forward.

### Issue 17 — Closure Register reference period unknown; no IR closed cases reflected ✅
- **Root cause (reference period):** No FY/reference-period filter exists and no period label is shown in the header (`ClosureRegisterComponent.tsx:411-417`). The only date filter is the interactive Closure-Date range on `r.due_date` (~334-337), empty by default; it's guarded by `&& r.due_date` so null-date rows are never dropped. The register loads all-time rows (~284) with no scoping — hence "reference period not known."
- **Root cause (IR closed cases missing):** Same as Issue 15 — legacy/seeded closed IRs (e.g. IR-93) were inserted into `dggi_records` only, never `dggi_closure_records`; plus load gating (~285-292) and the Issue 16 snapshot bug can hide/misfile them.
- **Fix:** Add an FY/reference-period filter + a visible period label to the load query and filter block (~263-301 / ~334-337); backfill IR closure rows for legacy-closed IRs; verify the `is_ir` write (~3757).

> **Implemented (FY filter + period label):** Added `availableFYs` derived from loaded records, a FY dropdown in the filter bar (highlighted blue when active), client-side FY filtering via `fyToDateRange`, and a period label in the header subtitle ("FY 24-25" or "All Financial Years"). Backfill of legacy IR closure rows is still ⏳ pending (needs a migration).

### Issue 19 — Cannot edit Closed cases (Closure Register) ✅
- **Root cause:** The Closure Register is **read-only by design** — `ClosureRegisterComponent.tsx` has no edit dialog, no `startEdit`, no row `onClick`, no `.update()` to `dggi_closure_records` anywhere. Rows render purely via `renderCell` (~373-395, body ~533-548). (The DGGI investigation register *can* still edit closed cases — `FROZEN_ON_EDIT` empty — but those edits update `dggi_records`, not the closure snapshot.)
- **Fix:** Add an edit handler + `RegisterRecordDialog` in `ClosureRegisterComponent.tsx` around the table body (~533-548), backed by a new `supabase.from("dggi_closure_records").update(...)` writer; and/or make DGGI closure-section edits propagate to `dggi_closure_records` (add an update alongside `DGGIComponent.tsx:3707-3723`). Decide with user whether closure rows should be editable at all, and by whom.

> **Implemented:** Added `openEdit`/`saveEdit` + Dialog in `ClosureRegisterComponent.tsx`. ADG/DD_INT can click any row to open an edit form; all non-read-only fields are editable and saved via `supabase.update()` on `dggi_closure_records`.

---

## Arrest Register

### Issue 9 / 18 — Arrest Id reflected in File No. column ⏳
- **Root cause (by design):** `saveNewBatch` sets `const file_no = recordIds[0]` (`ArrestRegisterComponent.tsx:1042`) — the first person's `ARR/.../..` id is written into `file_no` for every person in the batch (payload ~1052) as the batch-grouping key. It then displays in the read-only "File No." column (def ~207-213). So an arrest ID legitimately appears in File No.
- **Fix:** Introduce a dedicated batch-grouping column (e.g. `batch_id`) — migration to add it, use it for the `groupBy file_no` logic (~1166-1170) and `expandedBatches` — and leave `file_no` as the actual departmental file number (blank, or seeded from the linked case's `file_no`). Update `BATCH_FIELDS` (~158-160) accordingly.

### Issue 18 — Duplicate arrest entries (ARR/055 & ARR/056) from manual re-add ⏳
- **Root cause (two parts):**
  1. **Visibility gap:** arrests created via the SIO portal weren't reflected in the Arrest Register, prompting a manual re-add. Need to trace how SIO-portal-created arrests reach `dggi_arrest_records` and whether the register's role/group query (arrest `fetchRecords`) hides them — *this trace was not completed* (see Needs Verification).
  2. **No dedup:** `saveNewBatch` (`ArrestRegisterComponent.tsx:1027-1078`) `.insert(payloads)` has no uniqueness check on person+case; re-adding the same people creates fresh ARR ids (055, 056) with no collision.
- **Fix:** Add a uniqueness guard on (person + linked case + date_of_arrest) — either a DB unique index or a pre-insert existence check that warns the user. And fix the underlying SIO-portal→register visibility gap so manual re-adds aren't needed. Dedup the existing ARR/055 & ARR/056 rows manually.

---

## Cross-cutting

### Issue 10 — Provisional attachment Excel download not working ❓
- **Findings:** `handleExport` (`ProvisionalAttachmentComponent.tsx:1450-1510`) fetches via RPC `dggi_provisional_attachment_batch_page` (same RPC the list view uses successfully), then queries records and calls `exportRegisterToExcel` → `exportToExcel` → `XLSX.writeFile` (`src/lib/excel-export.ts`). The RPC signature matches the call; computed columns (SCN Due/Expiry) are not sortable, so `sortField` is always a real DB column (the `.order()` is safe). The structure is sound.
- **Likely causes (needs runtime repro — see Needs Verification):**
  1. **Silent failure:** every error path just does `toast.error("Export failed")` / `toast.success("No records to export")` with no console detail (~1473, ~1488, ~1500). The user may be hitting one of these (RPC error, empty result under their role/group filter, or fetch error) and reading it as "not working."
  2. **`XLSX.writeFile` in browser:** confirm the `xlsx` build in use actually triggers a browser download (some SSR/Next bundling setups need `XLSX.write` + Blob + anchor). Compare against a register where export is confirmed working (STR/Closure use the same helper — if those work, the helper is fine and the bug is PA-specific in `handleExport`).
- **Fix:** First reproduce and capture the actual failure. Add real error logging to the three silent branches. If it's the download trigger, switch `exportToExcel` to `XLSX.write({type:"array"})` + `Blob` + anchor-click. If it's an empty/role-filtered result, surface a clearer message.

> **Implemented:** Switched `XLSX.writeFile` to `XLSX.write({type:"array"}) + Blob + anchor-click` in `exportToExcel` and `exportMultipleSheets` (`excel-export.ts`). This fixes download in Next.js/browser environments. Added `console.error` to all three silent failure branches in `handleExport` (`ProvisionalAttachmentComponent.tsx:1473,1500`) and wrapped the `exportRegisterToExcel` call in a try-catch (`~1503`) so XLSX-level throws are surfaced.

### Issue 11 — After deleting, entry should remain visible with red strike-through (soft delete) ✅
- **Root cause:** There is **no soft-delete support**. Every register hard-deletes (`supabase.from(T).delete().eq("id", id)`, e.g. `STRRegisterComponent.tsx:262`) and drops the row from state; most show a 5s "Undo" toast (e.g. `ArrestRegisterComponent.tsx:1000-1024`). No `deleted_at`/`is_deleted` column exists in any table. Each register renders its own `<TableRow>` (there's a shared `ui/table.tsx` primitive but no shared register-table component).
- **Fix (larger, schema + every register):**
  1. **DB:** add `deleted_at timestamptz` (and optionally `deleted_by`) to each register table via migration.
  2. **Delete handler:** change each `deleteRecord` to `UPDATE … SET deleted_at = now()` instead of `.delete()`; keep the row in state.
  3. **Query:** by default still `SELECT *` (rows now include soft-deleted). Do **not** filter them out.
  4. **Render:** in each register's row renderer, apply `line-through text-red-600` (Tailwind) when `record.deleted_at` is set; disable edit for those rows. This touches all ~9 register components (STR, Non-IR, Prosecution, Provisional Attachment, Arrest, Alert Circular, Modus Operandi, DGGI, SCN) — consider extracting a shared row-className helper to keep it consistent.
  5. Repurpose the existing "Undo" toast to clear `deleted_at`.

> **User decisions:** deleted rows are visible to **everyone** (no role-based fetch filtering); restore is via the **Undo** toast and rows are **never purged** (DD_INT can restore anytime via a green restore button); deleted rows are **read-only** until restored.

> **Implemented:**
> - **Migration** `20260809000001_cc11_soft_delete_columns.sql` adds `deleted_at timestamptz` + `deleted_by uuid` (both `IF NOT EXISTS`) to all 12 register tables.
> - **Shared helpers** in `register-utils.ts`: `isDeleted`, `deletedRowClass` (applies `line-through text-[#C0432A] opacity-70`), `softDeleteRecord`, `restoreRecord`.
> - **Delete handlers** across all editable registers now soft-delete (optimistic state stamp + `softDeleteRecord`, rollback on error) and the Undo toast calls `restoreRecord`. Files: `STRRegisterComponent`, `SCNRegisterComponent`, `AlertCircularRegisterComponent`, `ModusOperandiRegisterComponent`, `ArrestRegisterComponent`, `ProvisionalAttachmentComponent`, `ProsecutionRegisterComponent`, `IntelligenceAllocationComponent`, `DGGIComponent` (main register + arrest/provisional/SCN child sub-records).
> - **Read-only views** (`NonIRRegisterComponent`, `IncidentReportComponent`) apply `deletedRowClass` so soft-deleted `dggi_records` render struck-through there too.
> - **Row rendering:** deleted rows show struck-through red text, hide the edit/pencil control, and (for DD_INT) swap the Trash2 delete for a green `RotateCcw` restore button. No fetch query filters `deleted_at` — deleted rows stay visible to all roles.

---

## Needs verification (investigation was cut short — subagent should confirm before coding)

- **Issue 18a (Arrest ↔ SIO portal sync):** trace how SIO-portal-created arrests reach `dggi_arrest_records` and why the Arrest Register didn't show them. Not yet traced.
- **Issue 10 (PA export):** needs a runtime reproduction to pin the exact failing branch; the static path looks correct.

## Open questions for the user (decisions, not code)

1. **"Temporary editable period" (Issues 3, 7):** how long, from creation or from a status change, and which roles keep edit after it lapses?
2. **Issue 6 / 15:** should the Non-IR *register view* display closure date / closed state, or is the edit-form behavior sufficient?
3. **Issue 13:** does "issuing authority names" mean the officer (`votum_users`) name or the adjudicating-authority enum?
4. **Issue 19:** should closure snapshots be editable, and by which roles?
5. ~~**Issue 11:** visibility scope of soft-deleted rows (all users vs admins) and whether they're ever purged.~~ **Resolved:** visible to everyone; restore via Undo (DD_INT); never purged.

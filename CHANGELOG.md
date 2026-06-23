# Changelog

## [Unreleased]

### 2026-06-23

#### SIO Selector — Group Filtering (all registers)
- SIO dropdown in add/edit dialogs now only shows users from the active user's DGGI group
- ADG and DD_INT roles continue to see all workspace users
- Extracted reusable hook `useGroupFilteredSioUsers` (`src/hooks/useGroupFilteredSioUsers.ts`) — returns `{ allUsers, sioUsers, loading }`; `allUsers` used for name resolution in table display, `sioUsers` passed to dialogs
- Migrated all 16 register components off the inline `getAllUsers` + group-mate pattern to the hook
- Spec: no separate doc (self-contained hook)

#### IR Case — Linked Register Tracker (planned)
- Slide-over drawer on each IR case row showing all register records linked to that case, grouped by register type with per-record status badges
- When the case is closed (`closure_by` is set), drawer shows a "Case Closed" banner and dims all linked register entries with a Closed chip
- Covers: Arrest, Provisional Attachment, SCN, Prosecution (arrest + non-arrest), Evidence Room, DFL, Alert/Circular, CPGRAM, Informer Reward
- Read-only; no DB changes required
- Full spec: `docs/ir-case-register-tracker.md`

### 2026-06-15

#### Arrest Register (batch grouping)
- One arrest event can now have multiple arrested persons — each person gets their own row (`record_id`), all rows in the same event share an **Arrest No.** (`arrest_batch_id`, prefix `ARB/`)
- Table groups rows by `arrest_batch_id`: single-person events render as flat rows; multi-person events show a collapsible header with shared fields and a person count
- **Add Person** button on multi-person batch headers opens a dialog pre-filled with batch-level fields (case, date, party, GSTIN, amount, SIO, group) — only person-level fields are editable
- DB migration: adds `arrest_batch_id TEXT` column to `dggi_arrest_records`

#### Arrest Register
- Split "Name & Registration No. of Unit" column into two separate fields: **Name of Party** and **GSTIN of Unit**
- Added **Whether Prosecution Filed** selector with options: Yes / No / Pending
- Auto-fill from linked case now populates Name of Party and GSTIN of Unit independently
- DB migration: adds `party_name`, `unit_gstin`, `prosecution_filed` columns to `dggi_arrest_records`; migrates existing `unit_name_reg` data

#### Closure Register
- Renamed "Closure Reason" column to **Closure Type** (maps to `closure_by` — the action taken, e.g. Transfer To, Closed)
- Added **Closure Reason** column showing the free-text reason entered at closure
- Added **Transferred To** column showing the destination when closure type is "Transfer To"
- DB migration: adds `closure_reason` and `transferred_to` columns to `dggi_closure_records`
- DGGI Component now writes `closure_reason` and `transferred_to` into the closure record on save

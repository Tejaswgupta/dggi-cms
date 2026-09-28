# Standard Operating Procedure (SOP) Manual

## DGGI Case & Compliance Management Platform

This manual explains how to use the platform day-to-day: signing in, working
each register, linking records to a case, and understanding statuses,
notifications and roles. It documents behavior as implemented in the app —
if a screen looks different, the code is the source of truth, not this doc.

---

## 1. Access & Roles

Sign in at `/auth/signin`. Forgot password → `/auth/forgot-password`.
Unauthenticated visits to any page redirect to sign-in.

Roles (`dggi_role`) and what they unlock in the left nav:

| Role                                 | Access                                                     |
| ------------------------------------ | ---------------------------------------------------------- |
| `ADG`                                | Everything, incl. Users, Officer Activity, MPR             |
| `DD_INT`                             | Everything except Officer Activity; Users, MPR             |
| `DD_REPORTS`                         | MPR, Notifications; Intelligence Monitoring hidden         |
| `DD`, `AD`, `ADC`, `JD`, `IO`, `SIO` | Standard registers; `SIO`/`DD`/`IO` also get Notifications |
| `SIO_INT`                            | Locked down — only Intelligence Monitoring                 |

If a menu item you expect is missing, it's role-gated — ask an `ADG`/`DD_INT`
user to check your role under **Users**.

---

## 2. The Case File (Investigation Cases)

Every enforcement action traces back to one **case** — a row in the case
master (`Investigation Cases`, IR or NON-IR). This is where a matter starts.

- **Create an IR case**: go to _Incident Report_ → New Record. Case gets ID
  `NNN/GST/YYYY-YY` (e.g. `001/GST/2026-27`).
- **Create a NON-IR case**: go to _NON-IR Register_ → New Record. Case gets
  ID `NIR-NNN-YY-YY`.
- Core fields: taxpayer name, GSTIN(s), file no., intelligence source, issue
  involved, handling SIO/group, detection amount.
- **Converting NON-IR → IR**: from the case record, choose _Convert to IR_ —
  this opens a pre-filled IR creation form; on save the NON-IR case is closed
  and a linked IR case is created.
- **Closing a case**: set `latest_status`/closure action:
  - _Closed After Payment of Tax_ — full-payment closure
  - _Closed_ / _Transferred_ (prompts a "Transferred To" field)
  - _Kept in Abeyance_ — flags the case as under special monitoring, stays open
- Closing a case creates a linked entry in the **Closure Register** with its
  own ID scheme (see §4) and moves the case's "View" link to point there.

---

## 3. Working a Register (applies to all registers)

All registers — Seizure, Arrest, Provisional Attachment, SCN, Prosecution,
Closure, Intelligence Monitoring — share the same interaction pattern:

1. **Find a record**: use the search/filter bar above the table.
2. **New Record**: click _New Record_, fill the dialog. If the record belongs
   to an existing case, use the **case combobox** — type the case name/GSTIN,
   pick from the dropdown (server-searches `Investigation Cases`, top 10
   matches). Selecting a case auto-fills taxpayer name, GSTIN, file no.,
   handling SIO/group, and detection date/amount — you don't retype them.
3. **Edit inline**: click a cell/row to edit directly in the table.
4. **Delete**: deletion is a _soft delete_ — the row is greyed out with
   strikethrough, not removed. Use **Restore** on the row to undo. There is
   no permanent/hard delete from the UI.
5. **Export**: use _Export to Excel_ to download the current filtered view.
6. **Deep link to a record**: URLs/notifications can carry a record ID as a
   hash (e.g. `#ARR/001/26-27`); opening that link scrolls to and highlights
   the row.
7. **Jump to the parent case**: click the link icon next to a record's case
   reference — this opens the case in _Investigation Cases_, or in _Closure
   Register_ if that case has since been closed.

---

## 4. Register Reference

| Register                | Purpose                                | ID format                                                                                                       | Notes                                                                                                                    |
| ----------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Incident Report (IR)    | Primary case file                      | `NNN/GST/YYYY-YY`                                                                                               | —                                                                                                                        |
| NON-IR Register         | Secondary case file                    | `NIR-NNN-YY-YY`                                                                                                 | Convertible to IR                                                                                                        |
| Arrest Register         | Arrest records                         | `ARR/NNN/YY-YY`                                                                                                 | Supports **batch arrests** — multiple people in one action get sequential IDs shown as a range, e.g. `ARR/050-052/26-27` |
| Provisional Attachment  | Bank a/c attachment                    | `PAR/NNN/YY-YY`                                                                                                 | Has `attachment_batch_id` for multi-account batches                                                                      |
| SCN Register            | Show Cause Notices                     | `SCN/NNN/YY-YY`                                                                                                 | Tracks adjudicating authority, competency, demand/interest                                                               |
| Prosecution Register    | Prosecution sanctions                  | `PRA` (arrest-linked) / `PRN` (non-arrest)                                                                      | Arrest-linked entries carry `linked_arrest_id` + sanction order date                                                     |
| Closure Register        | Case closures                          | IR full-payment: `DGGI/MZU/CR/FP/YYYY-YY/NNN`; IR other: `DGGI/MZU/CR-NSP-YYYY-YY/NNN`; NON-IR: `CNR-NNN-YY-YY` | Auto-created when a case is closed                                                                                       |
| Seizure Register        | Seizure entries                        | `SZR/NNN/YY-YY`                                                                                                 | Tracks SCN issuance date                                                                                                 |
| Intelligence Monitoring | Rapid Intel / Other-Source Intel / STR | `RPD`, `IOS`, `STR` prefixes respectively                                                                       | `SIO_INT` role's only visible module                                                                                     |
| MPR (Report Compliance) | Monthly performance report             | —                                                                                                               | Visible to `ADG`/`DD_INT`/`DD_REPORTS` only                                                                              |

ID numbers reset per fiscal year (Apr–Mar, shown as `YY-YY`) and are
allocated centrally — you cannot pick or edit the ID.

---

## 5. Deadlines & Notifications

- The platform auto-computes legal/procedural deadlines whenever a record is
  saved (e.g. SCN response window, arrest follow-up). These appear as a badge
  count in the nav.
- The badge counts deadlines due within the next **60 days**.
- Go to **Notifications** to see your inbox — includes deadline alerts and
  `ADG` review comments left on your records (via the comment thread on a
  case/record).
- Mark items read from the Notifications page; unread count drives the badge.

---

## 6. Common Tasks — Quick Steps

**Log a new seizure against an existing case**

1. _Seizure Register_ → New Record
2. Case combobox → search by taxpayer/GSTIN → select case (fields auto-fill)
3. Fill seizure-specific fields (items seized, value, SCN issuance date)
4. Save — record gets next `SZR/NNN/YY-YY`

**Record a multi-person arrest**

1. _Arrest Register_ → New Record → Batch mode
2. Link the case, add each person's details
3. Save — IDs are issued as a sequential block, shown as a range

**Close a case after tax payment**

1. Open the case in _Investigation Cases_
2. Set closure action = _Closed After Payment of Tax_, add closure reason
3. Save — case moves to _Closure Register_ with a `.../CR/FP/...` ID

**Undo an accidental delete**

1. Open the register the record was in
2. Find the greyed-out/strikethrough row (search still finds it)
3. Click **Restore**

**Remove a user and reassign their cases**

1. As `ADG` or `DD_INT`, go to **Users** and click **Remove user**.
2. Review the assigned case and DGGI register counts. If any are assigned, choose a replacement `SIO` and one of their groups.
3. Click **Transfer and remove**. Cases and assigned register records move to the replacement before the user is removed. If the transfer fails, the user and assignments stay in place.
4. If there are no assigned cases or records, click **Remove**; no replacement is needed.

---

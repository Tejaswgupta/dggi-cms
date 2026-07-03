# DGGI Deadline Rules

## Table Columns (Supabase select strings)

| Table | Columns |
|---|---|
| `dggi_scn_records` | `id, record_id, workspace_id, last_date_oio, date_of_scn, noticee_name, adjudication_formation:votum_users(name), group, sio` |
| `dggi_provisional_attachment_records` | `id, record_id, workspace_id, date_of_attachment, person_name, group_sio:votum_users(name), scn_issued, date_of_scn_issuance, date_of_release, out_of_monitoring, group, sio` |
| `dggi_prosecution_arrest_records` | `id, record_id, workspace_id, date_of_arrest, arrested_person_name, entity_name, prosecution_complaint_status, bail_status, date_of_filing, group, sio` |
| `dggi_prosecution_non_arrest_records` | `id, record_id, workspace_id, date_of_order, remarks, group, sio` |
| `dggi_seizure_records` | `id, record_id, workspace_id, date_of_seizure, entity_name, seized_by:votum_users(name), scn_issued, scn_issue_date, extended_by_commissioner, group, sio` |
| `dggi_intel_rapid_records` | `id, record_id, workspace_id, group_allocation_date, adg_putup_date, date_of_action_taken, ir_date, received_against_entity, assigned_group, sio` |
| `dggi_str_records` | `id, record_id, workspace_id, group_allocation_date, adg_putup_date, date_of_action_taken, ir_date, received_against_entity, assigned_group, sio` |
| `dggi_records` | `id, record_id, workspace_id, created_at, intelligence_action_date, intel_approved_date, taxpayer_name, handling_io_sio:votum_users(name), is_ir, date_of_ir, date_of_non_ir, group` |
| `dggi_dfl_records` | `id, record_id, workspace_id, date_of_request, report_received_date, entity_name, dfl_request_no, group, sio` |

---

## Deadline Rules

### `dggi_intel_rapid_records` — Intelligence Monitoring (Rapid)

#### intel_adg_putup — ADG Put-up deadline (30 days)

| Field | Value |
|---|---|
| Legal reference | Int. Procedure (30 days) |
| Reference field | `group_allocation_date` |
| Deadline | +30 days |
| Reminders | 30d, 14d, 7d, 3d, 1d before |
| Critical window | ≤ 5 days |
| Warning window | ≤ 14 days |
| Skip if not null | `adg_putup_date` |

#### intel_execution_deadline — Intelligence Execution deadline (10 days from group allocation)

| Field | Value |
|---|---|
| Legal reference | Int. Procedure – Execution |
| Reference field | `group_allocation_date` |
| Deadline | +10 days |
| Reminders | 10d, 5d, 3d, 1d before |
| Critical window | ≤ 2 days |
| Warning window | ≤ 5 days |
| Skip if not null | `date_of_action_taken` |

---

### `dggi_str_records` — Intelligence Monitoring (STR)

#### intel_adg_putup — ADG Put-up deadline (30 days)

| Field | Value |
|---|---|
| Legal reference | Int. Procedure (30 days) |
| Reference field | `group_allocation_date` |
| Deadline | +30 days |
| Reminders | 30d, 14d, 7d, 3d, 1d before |
| Critical window | ≤ 5 days |
| Warning window | ≤ 14 days |
| Skip if not null | `adg_putup_date` |

#### intel_execution_deadline — Intelligence Execution deadline (10 days from group allocation)

| Field | Value |
|---|---|
| Legal reference | Int. Procedure – Execution |
| Reference field | `group_allocation_date` |
| Deadline | +10 days |
| Reminders | 10d, 5d, 3d, 1d before |
| Critical window | ≤ 2 days |
| Warning window | ≤ 5 days |
| Skip if not null | `date_of_action_taken` |

---

### `dggi_provisional_attachment_records` — Provisional Attachment

#### provisional_attachment_lapse — Attachment order lapses

| Field | Value |
|---|---|
| Legal reference | Sec 83(2) CGST |
| Reference field | `date_of_attachment` |
| Deadline | +365 days |
| Reminders | 60d, 30d, 7d before |
| Critical window | ≤ 30 days |
| Warning window | ≤ 60 days |
| Skip if not null | `date_of_release` |
| Skip if | `out_of_monitoring` = `"true"` |

#### provisional_attachment_scn_due — SCN must be issued (9-month deadline)

| Field | Value |
|---|---|
| Legal reference | Sec 83(2) CGST |
| Reference field | `date_of_attachment` |
| Deadline | +273 days |
| Reminders | 30d, 14d, 7d before |
| Critical window | ≤ 14 days |
| Warning window | ≤ 30 days |
| Skip if not null | `date_of_scn_issuance` |
| Skip if | `scn_issued` = `"Yes"` |

---

### `dggi_prosecution_arrest_records` — Prosecution (Arrest)

#### prosecution_complaint_filing_bail_not_given — Prosecution complaint filing (Bail not given)

| Field | Value |
|---|---|
| Legal reference | Sec 132(6) CGST – 60-day window |
| Reference field | `date_of_arrest` |
| Deadline | +60 days |
| Reminders | 14d, 7d, 1d before |
| Critical window | ≤ 7 days |
| Warning window | ≤ 14 days |
| Skip if not null | `date_of_filing` |
| Skip if | `prosecution_complaint_status` = `"Filed"` OR `bail_status` = `"Bail Given"` |

#### prosecution_complaint_filing_bail_given — Prosecution complaint filing (Bail given)

| Field | Value |
|---|---|
| Legal reference | Sec 132(6) CGST – 6-month window |
| Reference field | `date_of_arrest` |
| Deadline | +180 days |
| Reminders | 30d, 14d, 7d before |
| Critical window | ≤ 14 days |
| Warning window | ≤ 30 days |
| Apply only if | `bail_status` = `"Bail Given"` |
| Skip if not null | `date_of_filing` |
| Skip if | `prosecution_complaint_status` = `"Filed"` |

---

### `dggi_seizure_records` — Seizure

#### seizure_scn_primary — Issue SCN or return goods (6-month deadline)

| Field | Value |
|---|---|
| Legal reference | Sec 67(7) CGST |
| Reference field | `date_of_seizure` |
| Deadline | +180 days |
| Reminders | 30d, 14d, 7d before |
| Critical window | ≤ 14 days |
| Warning window | ≤ 30 days |
| Apply only if | `extended_by_commissioner` = `"No"` |
| Skip if not null | `scn_issue_date` |
| Skip if | `scn_issued` = `"Yes"` |

#### seizure_scn_extended — Extended SCN deadline (12 months, Commissioner extension)

| Field | Value |
|---|---|
| Legal reference | Sec 67(7) CGST |
| Reference field | `date_of_seizure` |
| Deadline | +365 days |
| Reminders | 30d, 14d, 7d before |
| Critical window | ≤ 14 days |
| Warning window | ≤ 30 days |
| Apply only if | `extended_by_commissioner` = `"Yes"` |
| Skip if not null | `scn_issue_date` |
| Skip if | `scn_issued` = `"Yes"` |

---

### `dggi_records` — IR / NON-IR Cases

#### non_ir_initiation_deadline — NON-IR initiation fields must be updated (10 days from creation)

| Field | Value |
|---|---|
| Legal reference | Int. Procedure – NON-IR Initiation |
| Reference field | `created_at` |
| Deadline | +10 days |
| Reminders | 10d, 5d, 3d, 1d before |
| Critical window | ≤ 2 days |
| Warning window | ≤ 5 days |
| Apply only if | `is_ir` = `"false"` |
| Skip if not null | `intel_approved_date` |

#### intel_approved_to_action_deadline — Intelligence Action must follow Approved Date (10 days)

| Field | Value |
|---|---|
| Legal reference | Int. Procedure – Intel Approved to Action |
| Reference field | `intel_approved_date` |
| Deadline | +10 days |
| Reminders | 10d, 5d, 3d, 1d before |
| Critical window | ≤ 2 days |
| Warning window | ≤ 5 days |
| Skip if not null | `intelligence_action_date` |

#### non_ir_closure_deadline — NON-IR must be closed / created / transferred (30 days from action)

| Field | Value |
|---|---|
| Legal reference | Int. Procedure – NON-IR |
| Reference field | `intelligence_action_date` |
| Deadline | +30 days |
| Reminders | 30d, 14d, 7d, 3d before |
| Critical window | ≤ 5 days |
| Warning window | ≤ 14 days |
| Apply only if | `is_ir` = `"false"` |
| Skip if not null | `date_of_non_ir` |

---

### `dggi_prosecution_non_arrest_records` — Prosecution (Non-Arrest)

#### prosecution_non_arrest_sanction — Prosecution sanction / filing (6-month deadline)

| Field | Value |
|---|---|
| Legal reference | Sec 132 CGST |
| Reference field | `date_of_order` |
| Deadline | +180 days |
| Reminders | 30d, 14d, 7d before |
| Critical window | ≤ 14 days |
| Warning window | ≤ 30 days |

---

### `dggi_dfl_records` — DFL Register

#### dfl_report_deadline — DFL report receipt deadline (60 days)

| Field | Value |
|---|---|
| Legal reference | Int. Procedure – DFL |
| Reference field | `date_of_request` |
| Deadline | +60 days |
| Reminders | 60d, 10d, 0d before |
| Critical window | ≤ 10 days |
| Warning window | ≤ 20 days |
| Skip if not null | `report_received_date` |

---

### `dggi_scn_records` — SCN Register

#### scn_oio_due — Last date to pass OIO

| Field | Value |
|---|---|
| Legal reference | Sec 73(10) / 74(10) CGST |
| Reference field | `last_date_oio` |
| Deadline | +0 days (the field itself is the deadline) |
| Reminders | 60d, 30d, 7d, 1d before |
| Critical window | ≤ 30 days |
| Warning window | ≤ 60 days |

#### scn_noticee_reply — Noticee reply deadline

| Field | Value |
|---|---|
| Legal reference | Sec 75(4) CGST |
| Reference field | `date_of_scn` |
| Deadline | +30 days |
| Reminders | 7d, 3d, 1d before |
| Critical window | ≤ 3 days |
| Warning window | ≤ 7 days |

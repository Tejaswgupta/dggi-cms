# DGGI Ingest Column Mapping

## IR Pending Cases — `ingest_ir_digit_data.py`

**Source:** `data/MZU_ Pending IR cases.xlsx` · Sheet: `30062026`  
**Rows:** row 0 = title, row 1 = header, data from row 2

| Col | Excel Header | DB Field | Notes |
|-----|-------------|----------|-------|
| 0 | Sr. No. | *(upsert key)* | Skip if null or non-integer |
| 1 | Name of the Taxpayer | `taxpayer_name` | Skip row if empty |
| 2 | GSTIN/PAN | `gstins` | |
| 3 | IR No./335-J No. | `record_id` (upsert key 1) | Used as record_id on insert |
| 4 | Date of Detection/IR Date | `date_of_ir`, `date_of_initiation` | Accepts datetime, DD.MM.YYYY, DD/MM/YYYY |
| 5 | *(second date)* | — | Skipped |
| 6 | Pending since (days) | — | Skipped |
| 7 | Pendency Year Wise | — | Skipped |
| 8 | Detection (in Lakhs) | `detection_amount` | Multiplied × 1,00,000 → stored as rupees |
| 9 | Additional Detection (In Lakhs) | — | Skipped |
| 10 | Recovery (In Lakh) | `recovery_itc` | Multiplied × 1,00,000 → stored as rupees |
| 11 | Additional Recovery (In Lakhs) | — | Skipped |
| 12 | Type of Case | — | Skipped |
| 13 | Brief Facts of the Case | `issue_involved` | Appended with `IR No: <val>` |
| 14 | Present Status | `latest_status` | If == "Closure Report Filed" → triggers closure insert |
| 15 | Expected Date of Closure/SCN | — | Skipped |
| 16 | Name of SIO | `sio_name` | |
| 17 | Group | `group` | Stored as `"Group <letter>"` |
| 18 | Section (73/74/76) | — | Skipped |
| 19 | Whether in DIGIT (DIGIT No.) | `digit_id` (upsert key 2) | Only numeric-format IDs kept (e.g. `20251103132254-640`); `"ok"`, `"Not in Digit"` discarded |

**Dedup order:** IR No. (col 3) → digit_id (col 19) → insert with `record_id = IR No.` (fallback `DIGIT-{sr_no:03d}`)

---

## Non-IR Pending Cases — `ingest_non_ir_data.py`

**Source:** `data/MZU_ Non-IR Pending.xlsx` · Sheet: `Pending Non-IR`  
**Rows:** row 0 = title, row 1 = header, data from row 2

| Col | Excel Header | DB Field | Notes |
|-----|-------------|----------|-------|
| 0 | Sr. No. | *(upsert key)* | Skip if null or non-integer |
| 1 | Non-IR Register No. | `file_no` (upsert key 1) | Often null; used to match existing records |
| 2 | Name of TP | `taxpayer_name` | |
| 3 | GSTIN | `gstins` | |
| 4 | Initiation date | `date_of_non_ir` | Accepts datetime, DD.MM.YYYY, DD/MM/YYYY |
| 5 | REIC/Co-lending | — | Skipped |
| 6 | SIO | `sio_name` | |
| 7 | Group | `group` | Stored as `"Group <letter>"` |
| 8 | Mode | `mode_of_initiation` | e.g. Summons, Search, Inspection |
| 9 | Current Status | `latest_status` | |

**record_id assignment:** rows sorted by initiation date ascending → assigned `NIR-{seq:03d}-{fy}` sequentially  
**Dedup order:** file_no (col 1, if non-null) → insert with new sequential `NIR-…` record_id

---

## Fixed Fields (both scripts)

| Field | IR value | Non-IR value |
|-------|----------|-------------|
| `is_ir` | `true` | `false` |
| `date_of_ir` | from col 4 | `null` |
| `date_of_initiation` | from col 4 | `null` |
| `workspace_id` | resolved from `ajinkya.k1@gov.in` | same |

# Excel Data Ingestion Mapping

**Source File:** `Pendency, SCN & Saadhit Target-2 Data.xlsx`  
**Date Ingested:** 2026-07-10  
**Total Records:** 142 (92 IR + 18 SCN + 32 NON-IR)

---

## Summary

| Sheet | Target Table | Records | Columns Mapped | Columns Skipped |
|---|---|---|---|---|
| FInal Pendency | `dggi_records` (`is_ir=true`) | 92 | 13 | 7 |
| SCN | `dggi_scn_records` | 18 | 12 | 4 |
| NON-IR | `dggi_records` (`is_ir=false`) | 32 | 7 | 3 |
| **TOTAL** | | **142** | **32** | **14** |

---

## Sheet 1: FInal Pendency → `dggi_records` (IR Cases)

### Mapped Columns (13)

| Excel Column | Excel Header | DB Column | Transformation |
|---|---|---|---|
| 1 | Name of the Taxpayer | `taxpayer_name` | `.strip()` |
| 2 | GSTIN/PAN | `gstins` | `.strip()` |
| 3 | IR No./335-J No. | `file_no` | **Upsert key** — `.strip()` |
| 4 | Date of Detection/IR Date | `date_of_ir` + `date_of_initiation` | Parse datetime or `DD.MM.YYYY` → ISO date |
| 8 | Detection (in Lakhs) | `detection_amount` | `str(float(val))` if non-zero, else NULL |
| 10 | Recovery (in Lakh) | `recovery_itc` | `str(float(val))` if non-zero, else NULL |
| 12 | Type of the Case | `issue_involved` | Combined: `"{brief_facts} \| Type: {type} \| Section: {section}"` |
| 13 | Brief Facts of the Case | `issue_involved` | Primary part of combined field |
| 14 | Present Status | `latest_status` | `.strip()` |
| 15 | Expected Date of Closure/SCN | `due_date` | Parse date → ISO |
| 17 | Group | `group` | `"A"` → `"Group A"`, etc. |
| 18 | Case booked under section | `issue_involved` | Combined into `issue_involved` (see col 12) |
| 19 | Whether in DIGIT (DIGIT No.) | `digit_id` | `.strip()` |

**Hardcoded fields:**
- `is_ir = true`
- `workspace_id` = looked up from `ajinkya@gov.in`
- `record_id` = auto-generated on insert (`IR-###-26-27`)

### Skipped Columns (7)

| Excel Column | Excel Header | Reason |
|---|---|---|
| 0 | Sr. No. | Row counter — meaningless |
| 5 | (unlabeled — as-of date) | Static "30.06.2026" reference date |
| 6 | Pending since (days) | Computed value — derivable from detection date |
| 7 | Pendency Year Wise | Derived bucket ("1-2 years") — not stored |
| 9 | Additional Detection (in Lakhs) | No corresponding DB column |
| 11 | Additional Recovery (in Lakhs) | No corresponding DB column |
| 16 | Name of SIO | No way to map Excel names to user UUIDs — left NULL for manual assignment |

---

## Sheet 2: SCN → `dggi_scn_records`

### Mapped Columns (12)

| Excel Column | Excel Header | DB Column | Transformation |
|---|---|---|---|
| 1 | Date of detection | `remarks` | Combined: `"Zone: {zone} \| Detection: {date}"` |
| 2 | Name of the party | `noticee_name` | `.strip()` |
| 3 | GSTIN | `gstin_pan` | `.strip()` |
| 4 | SCN No. | `scn_no` | **Upsert key** — `.strip()` |
| 5 | SCN date | `date_of_scn` | Parse date (string or datetime) → ISO |
| 6 | Amount Involved (in Lakhs) | `demand_tax` | `str(float(val))` if non-zero, else NULL |
| 7 | Name & Designation of AA | `adjudicating_authority` | `.strip()` |
| 8 | Adjudicating Authority Single/Common | `common_adjudicating_authority` | `.strip()` |
| 9 | Adjudicating Commissionerate | `adjudication_formation` | `.strip()` |
| 10 | Adjudicating Commissionerate Zone | `remarks` | Combined into `remarks` (see col 1) |
| 11 | Period Involved | `period_involved` | `.strip()` |
| 13 | Group | `group` | `"A"` → `"Group A"`, etc. |

**Hardcoded fields:**
- `workspace_id` = looked up from `ajinkya@gov.in`
- `record_id` = left NULL (complex format requires user assignment)

### Skipped Columns (4)

| Excel Column | Excel Header | Reason |
|---|---|---|
| 0 | Sr. No. | Row counter — meaningless |
| 12 | SIO | No way to map Excel names to user UUIDs — left NULL |
| 14 | Whether updated in DIGIT | Informational Yes/No flag — no target column |
| 15 | MPR Month | Belongs in `dggi_mpr_records` table, not SCN records |

---

## Sheet 3: NON-IR → `dggi_records` (NON-IR Cases)

### Mapped Columns (7)

| Excel Column | Excel Header | DB Column | Transformation |
|---|---|---|---|
| 1 | Name of GSTIN | `taxpayer_name` | `.strip()` |
| 2 | GSTIN | `gstins` | `.strip()` — also fallback upsert key if no IR No. |
| 3 | Initiation date | `date_of_initiation` + `date_of_non_ir` | Parse date (string or datetime) → ISO |
| 5 | Group | `group` | `"A"` → `"Group A"`, etc. |
| 6 | Mode | `mode_of_initiation` | Must be one of: Letter/Email/Summons/Inspection/Search |
| 8 | Current Status | `latest_status` | `.strip()` |
| 9 | IR No. (if IR issued) | `file_no` | **Primary upsert key** — `.strip()` |

**Hardcoded fields:**
- `is_ir = false`
- `workspace_id` = looked up from `ajinkya@gov.in`
- `record_id` = auto-generated on insert (`NIR-###-26-27`)

**Upsert key logic:** Use `file_no` (col 9) if present; otherwise use `gstins` (col 2) as fallback.

### Skipped Columns (3)

| Excel Column | Excel Header | Reason |
|---|---|---|
| 0 | Sr. No. | Row counter — meaningless |
| 4 | SIO | No way to map Excel names to user UUIDs — left NULL |
| 7 | Month (as-of) | Static "as on 30.06.26" reference string — not a real date |

---

## Data Transformations

### Date Parsing
Handles multiple formats in order of precedence:
1. `datetime` objects → `.date().isoformat()`
2. `date` objects → `.isoformat()`
3. String formats: `DD.MM.YYYY`, `DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`
4. Returns `None` if unparseable

### Group Normalization
- Single letter `"A"` through `"F"` → `"Group A"` through `"Group F"`
- Already prefixed values pass through unchanged
- `None` or empty → `NULL`

### Amount Fields
- Convert to `float`, then `str(float)` for storage as text
- Zero values stored as `NULL`
- Non-numeric values passed through as-is

### Text Cleaning
- `.strip()` whitespace
- Empty strings converted to `NULL`

---

## Record ID Generation

### IR Records
**Format:** `{seq}/GST/{YYYY-YY}`  — matches DGGI Excel convention
- Sequence: 3-digit zero-padded counter (workspace-scoped, `is_ir = true` only)
- Fiscal Year: full 4-digit start year (e.g. `2026-27`)

**Example:** `001/GST/2026-27`, `002/GST/2026-27`, ...

### NON-IR Records
**Format:** `NIR-###-{YY-YY}`
- Prefix: `NIR`
- Sequence: 3-digit zero-padded counter (workspace-scoped, `is_ir = false` only)
- Fiscal Year: 2-digit short form (e.g. `26-27`)

**Example:** `NIR-001-26-27`, `NIR-002-26-27`, ...

### SCN Records
`record_id` left `NULL` — complex format requires user/SIO context:
- Expected format: `##/Grp-X/DD|SIO/Initials` (e.g., `01/Grp-A/SIO/MA`)
- Must be generated via UI with user assignment

---

## Upsert Strategy

### dggi_records (IR & NON-IR)
**Match key:** `(workspace_id, file_no)`
- If match found → UPDATE existing row (preserves `record_id`)
- If no match → INSERT new row (generates `record_id`)

### dggi_scn_records
**Match key:** `(workspace_id, scn_no)`
- If match found → UPDATE existing row
- If no match → INSERT new row

**Note:** Updates never overwrite `record_id` once set.

---

## Constraints Applied

### Group CHECK Constraint
Migration `20260710000001_add_group_f.sql` extends the `dggi_records.group` constraint to allow:
```sql
CHECK ("group" = ANY (ARRAY['Group A','Group B','Group C','Group D','Group E','Group F']))
```

Previously only `Group A` through `Group E` were allowed. The Excel contains 10 Group F records.

### Mode CHECK Constraint
`dggi_records.mode_of_initiation` must be one of:
- `Letter`
- `Email`
- `Summons`
- `Inspection`
- `Search`

Invalid values in Excel → stored as `NULL`.

---

## Scripts

### Ingestion Script
**Path:** `scripts/ingest_pendency_scn_data.py`

**Usage:**
```bash
python3 scripts/ingest_pendency_scn_data.py [path/to/file.xlsx] [--dry-run]
```

**Features:**
- Upserts by `file_no` / `scn_no` (idempotent, can re-run safely)
- Generates `record_id` for new inserts
- Writes `scripts/ingest_skipped.csv` for any rows that error
- `--dry-run` flag: prints what would be inserted/updated without writing

### Backfill Script
**Path:** `scripts/backfill_record_ids.py`

**Usage:**
```bash
python3 scripts/backfill_record_ids.py [--dry-run]
```

**Purpose:** Assigns sequential `record_id` values to existing records that have `record_id = NULL`, ordered by `created_at` within each workspace + `is_ir` type.

---

## Verification Queries

### Count imported records
```sql
-- IR records (imported range: IR-032 to IR-123)
SELECT COUNT(*) FROM dggi_records
WHERE workspace_id = 'e27632d5-19dc-49e6-92ec-df9a86567b40'
  AND is_ir = true
  AND record_id BETWEEN 'IR-032-26-27' AND 'IR-123-26-27';
-- Expected: 92

-- NON-IR records (imported range: NIR-049 to NIR-080)
SELECT COUNT(*) FROM dggi_records
WHERE workspace_id = 'e27632d5-19dc-49e6-92ec-df9a86567b40'
  AND is_ir = false
  AND record_id BETWEEN 'NIR-049-26-27' AND 'NIR-080-26-27';
-- Expected: 32

-- SCN records
SELECT COUNT(*) FROM dggi_scn_records
WHERE workspace_id = 'e27632d5-19dc-49e6-92ec-df9a86567b40'
  AND scn_no IN ('01/2026-27', '02/2026-27/Gr-D/HA', '03/26-27', ...);
-- Expected: 18
```

### Check for NULL record_ids
```sql
SELECT COUNT(*) FROM dggi_records
WHERE workspace_id = 'e27632d5-19dc-49e6-92ec-df9a86567b40'
  AND record_id IS NULL;
-- Expected: 0 (all should have record_id after backfill)
```

### Verify Group F records
```sql
SELECT COUNT(*) FROM dggi_records
WHERE workspace_id = 'e27632d5-19dc-49e6-92ec-df9a86567b40'
  AND "group" = 'Group F';
-- Expected: 10 (from IR Pendency sheet)
```

---

## Notes

1. **SIO Assignment:** All imported records have `handling_io_sio = NULL` and `handling_io_sio_name = NULL`. The Excel contained SIO names like "Vikramjeet Kaur", "DK", "Group A SIO 2", but these could not be reliably mapped to user UUIDs. Users must manually assign SIOs via the UI dropdown.

2. **Date Inconsistencies:** Some dates in the Excel are formatted as strings (`"14.10.2025"`), others as datetime objects. The parser handles both formats.

3. **Multi-value Fields:** A few taxpayer names span multiple lines/companies (e.g., "1. Mesh Trading\n2. KJS4U Multitrade..."). These are stored as-is in `taxpayer_name`.

4. **IR No. Formats:** IR numbers vary in format:
   - `438/GST/2024-25`
   - `67/GST/2025.26` (note: period instead of hyphen)
   - `146/2025-26-GST` (reversed order)
   
   All stored as-is in `file_no` — no normalization applied.

5. **Duplicate Prevention:** The upsert logic prevents duplicates by matching on `(workspace_id, file_no)` or `(workspace_id, scn_no)`. Re-running the ingestion script updates existing records rather than creating duplicates.

6. **Fiscal Year:** The `record_id` fiscal year suffix (`26-27`) is computed dynamically based on the script execution date (April-March fiscal year cycle). If the script is run after April 2027, new inserts will get `27-28` suffix.

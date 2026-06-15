# Changelog

## [Unreleased]

### 2026-06-15

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

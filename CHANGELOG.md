# Changelog

## [Unreleased]

### 2026-06-15

#### Arrest Register
- Split "Name & Registration No. of Unit" column into two separate fields: **Name of Party** and **GSTIN of Unit**
- Added **Whether Prosecution Filed** selector with options: Yes / No / Pending
- Auto-fill from linked case now populates Name of Party and GSTIN of Unit independently
- DB migration: adds `party_name`, `unit_gstin`, `prosecution_filed` columns to `dggi_arrest_records`; migrates existing `unit_name_reg` data

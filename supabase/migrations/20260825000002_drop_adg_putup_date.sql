-- adg_putup_date is dead: no form field, label, or .update()/.insert() payload
-- anywhere ever writes to it (verified across IntelligenceAllocationComponent.tsx,
-- DGGIComponent.tsx, STRRegisterComponent.tsx) — always null in production.
ALTER TABLE dggi_intel_rapid_records DROP COLUMN IF EXISTS adg_putup_date;
ALTER TABLE dggi_str_records DROP COLUMN IF EXISTS adg_putup_date;

-- Add e-Office reference number column to intel other source records
ALTER TABLE dggi_intel_other_source_records
  ADD COLUMN IF NOT EXISTS e_office_ref_no TEXT;

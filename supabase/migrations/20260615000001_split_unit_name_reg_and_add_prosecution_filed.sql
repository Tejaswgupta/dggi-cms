-- Split unit_name_reg into party_name + unit_gstin, add prosecution_filed
ALTER TABLE dggi_arrest_records
  ADD COLUMN IF NOT EXISTS party_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS unit_gstin text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prosecution_filed text NOT NULL DEFAULT '';

-- Migrate existing data: split on ' / ' if present, else put everything in party_name
UPDATE dggi_arrest_records
SET
  party_name = CASE
    WHEN unit_name_reg LIKE '% / %' THEN split_part(unit_name_reg, ' / ', 1)
    ELSE unit_name_reg
  END,
  unit_gstin = CASE
    WHEN unit_name_reg LIKE '% / %' THEN split_part(unit_name_reg, ' / ', 2)
    ELSE ''
  END
WHERE unit_name_reg IS NOT NULL AND unit_name_reg != '';

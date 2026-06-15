-- Split unit_name_reg into party_name + unit_gstin, add prosecution_filed
ALTER TABLE dggi_arrest_records
  ADD COLUMN IF NOT EXISTS party_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS unit_gstin text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS prosecution_filed text NOT NULL DEFAULT '';

-- Unify the intel-source receipt date column name across all three intake
-- tables. dggi_intel_other_source_records already used date_of_receipt;
-- dggi_intel_rapid_records used date_of_rapid and dggi_str_records used
-- date_of_str for the same role (deadline reference date). Rename both to
-- date_of_receipt so deadline-rules.json can share one column name.
ALTER TABLE dggi_intel_rapid_records
  RENAME COLUMN date_of_rapid TO date_of_receipt;

ALTER TABLE dggi_str_records
  RENAME COLUMN date_of_str TO date_of_receipt;

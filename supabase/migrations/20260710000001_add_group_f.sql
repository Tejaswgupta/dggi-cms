ALTER TABLE dggi_records
  DROP CONSTRAINT IF EXISTS dggi_records_group_check,
  ADD CONSTRAINT dggi_records_group_check
    CHECK ("group" = ANY (ARRAY['Group A','Group B','Group C','Group D','Group E','Group F']));

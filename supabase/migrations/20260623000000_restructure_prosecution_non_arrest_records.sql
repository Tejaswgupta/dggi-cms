-- Restructure dggi_prosecution_non_arrest_records to match arrest cases structure
-- Drops old aggregated columns, adds per-case columns

ALTER TABLE "public"."dggi_prosecution_non_arrest_records"
  DROP COLUMN IF EXISTS "opening_balance",
  DROP COLUMN IF EXISTS "cases_examined",
  DROP COLUMN IF EXISTS "prosecution_sanctioned_filed",
  DROP COLUMN IF EXISTS "no_of_persons",
  DROP COLUMN IF EXISTS "new_adjudication_orders",
  DROP COLUMN IF EXISTS "closing_balance",
  DROP COLUMN IF EXISTS "remarks",
  DROP COLUMN IF EXISTS "date_of_order",
  ADD COLUMN IF NOT EXISTS "person_name" "text",
  ADD COLUMN IF NOT EXISTS "age" "text",
  ADD COLUMN IF NOT EXISTS "date_of_arrest" "date",
  ADD COLUMN IF NOT EXISTS "amount_evaded_crore" "text",
  ADD COLUMN IF NOT EXISTS "entity_name" "text",
  ADD COLUMN IF NOT EXISTS "gstin" "text",
  ADD COLUMN IF NOT EXISTS "brief_modus_operandi" "text",
  ADD COLUMN IF NOT EXISTS "prosecution_complaint_status" "text",
  ADD COLUMN IF NOT EXISTS "date_of_filing" "date",
  ADD COLUMN IF NOT EXISTS "reasons_not_filed" "text",
  ADD COLUMN IF NOT EXISTS "sio_name" "text";

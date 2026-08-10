-- Add out-of-monitoring support (boolean + reason) to every deadline source table.
--
-- Context: only dggi_provisional_attachment_records had `out_of_monitoring`, but the
-- dashboard "Move Out of Monitoring" action (ADG-only) writes to all 7 deadline source
-- tables. This backfills the boolean where missing and adds a free-text reason column
-- so the action captures why a record was pulled from monitoring.

-- dggi_intel_rapid_records
ALTER TABLE "public"."dggi_intel_rapid_records"
  ADD COLUMN IF NOT EXISTS "out_of_monitoring" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "out_of_monitoring_reason" "text";

-- dggi_str_records
ALTER TABLE "public"."dggi_str_records"
  ADD COLUMN IF NOT EXISTS "out_of_monitoring" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "out_of_monitoring_reason" "text";

-- dggi_provisional_attachment_records (already has out_of_monitoring)
ALTER TABLE "public"."dggi_provisional_attachment_records"
  ADD COLUMN IF NOT EXISTS "out_of_monitoring" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "out_of_monitoring_reason" "text";

-- dggi_prosecution_arrest_records
ALTER TABLE "public"."dggi_prosecution_arrest_records"
  ADD COLUMN IF NOT EXISTS "out_of_monitoring" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "out_of_monitoring_reason" "text";

-- dggi_prosecution_non_arrest_records
ALTER TABLE "public"."dggi_prosecution_non_arrest_records"
  ADD COLUMN IF NOT EXISTS "out_of_monitoring" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "out_of_monitoring_reason" "text";

-- dggi_scn_records
ALTER TABLE "public"."dggi_scn_records"
  ADD COLUMN IF NOT EXISTS "out_of_monitoring" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "out_of_monitoring_reason" "text";

-- dggi_records
ALTER TABLE "public"."dggi_records"
  ADD COLUMN IF NOT EXISTS "out_of_monitoring" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "out_of_monitoring_reason" "text";

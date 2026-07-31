-- For legacy closure records, total_recovery is hardcoded from input data.
-- For records created from Aug 1 2026 onwards, the UI computes it as
-- recovery_cash + recovery_itc.

ALTER TABLE "public"."dggi_closure_records"
    ADD COLUMN IF NOT EXISTS "total_recovery" text;

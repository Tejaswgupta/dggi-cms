-- Monthly Performance Reports tracking table
-- Stores YES/NO filing status per report per month per workspace

CREATE TABLE IF NOT EXISTS "public"."dggi_mpr_records" (
  "id"           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "workspace_id" text NOT NULL,
  "year"         int NOT NULL,
  "month"        int NOT NULL CHECK (month BETWEEN 1 AND 12),
  "report_type"  text NOT NULL,
  "filed"        boolean NOT NULL DEFAULT false,
  "filed_date"   date,
  "filed_by"     text,
  "remarks"      text,
  "created_at"   timestamptz DEFAULT now(),
  "updated_at"   timestamptz DEFAULT now(),
  UNIQUE ("workspace_id", "year", "month", "report_type")
);

ALTER TABLE "public"."dggi_mpr_records" ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS "idx_dggi_mpr_workspace_month"
  ON "public"."dggi_mpr_records" ("workspace_id", "year", "month");

-- Migration: Add pr_adg_comments (jsonb) to dggi_intel_rapid_records, dggi_intel_other_source_records, and dggi_str_records

ALTER TABLE "public"."dggi_intel_rapid_records" ADD COLUMN IF NOT EXISTS "pr_adg_comments" jsonb;

ALTER TABLE "public"."dggi_intel_other_source_records" ADD COLUMN IF NOT EXISTS "pr_adg_comments" jsonb;

ALTER TABLE "public"."dggi_str_records" ADD COLUMN IF NOT EXISTS "pr_adg_comments" jsonb;

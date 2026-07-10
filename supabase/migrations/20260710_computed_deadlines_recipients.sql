-- Add display and recipient fields to dggi_computed_deadlines so the
-- notifications page and dashboard can query a single table instead of
-- joining back to 8 source tables on every user load.

ALTER TABLE "public"."dggi_computed_deadlines"
  ADD COLUMN IF NOT EXISTS "sio_user_id"      text,
  ADD COLUMN IF NOT EXISTS "group_name"       text,
  ADD COLUMN IF NOT EXISTS "entity_name"      text,
  ADD COLUMN IF NOT EXISTS "officer_name"     text,
  ADD COLUMN IF NOT EXISTS "critical_days"    int,
  ADD COLUMN IF NOT EXISTS "warning_days"     int,
  ADD COLUMN IF NOT EXISTS "max_reminder_days" int;

-- Indexes for per-user, per-group, and dashboard lookups
CREATE INDEX IF NOT EXISTS "idx_dggi_computed_deadlines_sio"
  ON "public"."dggi_computed_deadlines" ("workspace_id", "sio_user_id", "skipped", "deadline_date");

CREATE INDEX IF NOT EXISTS "idx_dggi_computed_deadlines_group"
  ON "public"."dggi_computed_deadlines" ("workspace_id", "group_name", "skipped", "deadline_date");

CREATE INDEX IF NOT EXISTS "idx_dggi_computed_deadlines_workspace_skipped"
  ON "public"."dggi_computed_deadlines" ("workspace_id", "skipped", "deadline_date");

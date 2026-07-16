ALTER TABLE "public"."dggi_computed_deadlines"
ADD COLUMN IF NOT EXISTS "linked_case_id" text;

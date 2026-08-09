-- Consolidate dggi_records officer assignment onto handling_io_sio and retire
-- the legacy assigned_user_id column.
--
-- handling_io_sio is the canonical officer column: the IR/NON-IR register UIs
-- write it, RBAC filters on it (.eq("handling_io_sio", uid)), and every
-- subsidiary register auto-fills the SIO from it. A few seeded NON-IR rows
-- (e.g. NIR-137/140) instead stored the officer in assigned_user_id + sio_name
-- and left handling_io_sio null, so they showed as "Unassigned" on the
-- dashboard and were invisible to their SIO under RBAC.
--
-- Step 1: backfill handling_io_sio from assigned_user_id wherever it is still
--         null, so no assignment is lost when the column is dropped.
-- Step 2: drop assigned_user_id (its FK and index are dropped automatically).
--
-- NOTE: this only touches dggi_records. dggi_intel_rapid_records also has an
-- assigned_user_id column — that one is unrelated and left untouched.

UPDATE "public"."dggi_records"
SET "handling_io_sio" = "assigned_user_id"
WHERE "handling_io_sio" IS NULL
  AND "assigned_user_id" IS NOT NULL;

ALTER TABLE "public"."dggi_records" DROP COLUMN IF EXISTS "assigned_user_id";

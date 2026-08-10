-- Normalize the three Intelligence Allocation tabs so every one uses the same
-- two columns with the same meaning:
--   assigned_group = actual DGGI group (constrained select: Group A..F)
--   transferred_to = free-text transfer destination, unrelated to any group
--
-- dggi_intel_rapid_records already followed this convention.
-- dggi_str_records had it INVERTED: `group` held the group and `assigned_group`
-- held free text (e.g. "Pune Regional Unit"), which leaked into the dashboard's
-- group filter via dggi_computed_deadlines.group_name.
-- dggi_intel_other_source_records was missing a transfer field entirely.

-- 1. Add transferred_to where it does not yet exist.
ALTER TABLE dggi_str_records
  ADD COLUMN IF NOT EXISTS transferred_to text;
ALTER TABLE dggi_intel_other_source_records
  ADD COLUMN IF NOT EXISTS transferred_to text;

-- 2. STR backfill. Order matters: copy the free text out BEFORE overwriting
--    assigned_group with the real group value.
UPDATE dggi_str_records
  SET transferred_to = assigned_group
  WHERE assigned_group IS NOT NULL AND assigned_group <> '';

UPDATE dggi_str_records
  SET assigned_group = "group";

-- 3. Drop the now-redundant STR group column so the schema matches the other
--    two tables (neither of which has a `group` column). "group" is a reserved
--    word and must stay quoted.
ALTER TABLE dggi_str_records DROP COLUMN IF EXISTS "group";

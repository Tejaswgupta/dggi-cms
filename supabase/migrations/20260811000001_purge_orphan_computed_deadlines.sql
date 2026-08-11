-- Purge orphaned rows from dggi_computed_deadlines.
--
-- The daily deadline-alerts job upserts one row per (workspace_id, rule_id,
-- row_id). Historically it only wiped-and-reinserted for tables with a
-- dedup_field; every other table (notably dggi_records) relied on upsert alone,
-- which can add/update but never delete a row whose source record disappeared.
-- When records were deleted or re-ingested under new UUIDs (same human-readable
-- record_id), the old computed rows were stranded with stale denormalized data
-- — most visibly an empty sio_user_id, which made assigned cases appear under
-- "Unassigned" in the Officer Exposure chart while their record_id click-through
-- resolved to the current, correctly-assigned record.
--
-- The job now wipes each source_table's rows before reinserting, so orphans can
-- no longer accumulate. This migration clears the backlog. Deleting an orphan
-- whose row_id points to a nonexistent source record is safe: the next job run
-- would recompute and reinsert any still-applicable deadline.

DELETE FROM public.dggi_computed_deadlines cd
WHERE cd.source_table = 'dggi_records'
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_records r WHERE r.id = cd.row_id
  );

DELETE FROM public.dggi_computed_deadlines cd
WHERE cd.source_table = 'dggi_provisional_attachment_records'
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_provisional_attachment_records r WHERE r.id = cd.row_id
  );

DELETE FROM public.dggi_computed_deadlines cd
WHERE cd.source_table = 'dggi_prosecution_arrest_records'
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_prosecution_arrest_records r WHERE r.id = cd.row_id
  );

DELETE FROM public.dggi_computed_deadlines cd
WHERE cd.source_table = 'dggi_intel_rapid_records'
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_intel_rapid_records r WHERE r.id = cd.row_id
  );

DELETE FROM public.dggi_computed_deadlines cd
WHERE cd.source_table = 'dggi_str_records'
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_str_records r WHERE r.id = cd.row_id
  );

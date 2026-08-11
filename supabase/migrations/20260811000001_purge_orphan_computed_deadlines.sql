-- Purge stale rows from dggi_computed_deadlines.
--
-- The daily deadline-alerts job upserts one row per (workspace_id, rule_id,
-- row_id). Three ways stale rows accumulated, none of which upsert can undo on
-- its own — upsert adds/updates the row_ids it's given but never deletes:
--   1. Orphans        — the source record was deleted or re-ingested under a new
--                        UUID (same human-readable record_id), so row_id no
--                        longer resolves.
--   2. Soft-deleted   — the source record has deleted_at set; it must vanish
--                        from every dashboard, but the job never excluded it.
--   3. Closed         — a dggi_records row with a non-empty closure_by is
--                        terminal and should track no further deadlines.
-- All three surfaced most visibly as an empty sio_user_id, making assigned (or
-- deleted) cases appear under "Unassigned" in the Officer Exposure chart while
-- the record_id click-through resolved to the current, correct record.
--
-- The job now (a) wipes each source_table's rows before reinserting and
-- (b) excludes soft-deleted and closed records, so these can no longer
-- accumulate. This migration clears the existing backlog. Deleting any of these
-- is safe: the next job run recomputes and reinserts every still-applicable
-- deadline.

-- 1 + 2 + 3 for dggi_records: drop rows whose source is gone, soft-deleted, or closed.
DELETE FROM public.dggi_computed_deadlines cd
WHERE cd.source_table = 'dggi_records'
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_records r
    WHERE r.id = cd.row_id
      AND r.deleted_at IS NULL
      AND (r.closure_by IS NULL OR btrim(r.closure_by) = '')
  );

-- 1 + 2 for every other register: drop rows whose source is gone or soft-deleted.
DELETE FROM public.dggi_computed_deadlines cd
WHERE cd.source_table = 'dggi_provisional_attachment_records'
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_provisional_attachment_records r
    WHERE r.id = cd.row_id AND r.deleted_at IS NULL
  );

DELETE FROM public.dggi_computed_deadlines cd
WHERE cd.source_table = 'dggi_prosecution_arrest_records'
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_prosecution_arrest_records r
    WHERE r.id = cd.row_id AND r.deleted_at IS NULL
  );

DELETE FROM public.dggi_computed_deadlines cd
WHERE cd.source_table = 'dggi_intel_rapid_records'
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_intel_rapid_records r
    WHERE r.id = cd.row_id AND r.deleted_at IS NULL
  );

DELETE FROM public.dggi_computed_deadlines cd
WHERE cd.source_table = 'dggi_str_records'
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_str_records r
    WHERE r.id = cd.row_id AND r.deleted_at IS NULL
  );

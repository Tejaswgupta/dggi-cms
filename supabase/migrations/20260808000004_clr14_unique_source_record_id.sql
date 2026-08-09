-- CLR-14: Prevent duplicate closure entries for the same source case.
-- Step 1: Remove duplicates, keeping the earliest created_at per (workspace_id, source_record_id).
DELETE FROM public.dggi_closure_records
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY workspace_id, source_record_id
             ORDER BY created_at ASC NULLS LAST
           ) AS rn
    FROM public.dggi_closure_records
    WHERE source_record_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Step 2: Add partial unique constraint.
CREATE UNIQUE INDEX IF NOT EXISTS dggi_closure_records_workspace_source_unique
  ON public.dggi_closure_records (workspace_id, source_record_id)
  WHERE source_record_id IS NOT NULL;

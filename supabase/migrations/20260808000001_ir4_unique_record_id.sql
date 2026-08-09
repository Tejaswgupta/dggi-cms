-- IR-4: Prevent duplicate record_ids in dggi_records.
-- Step 1: Remove duplicates, keeping the earliest created_at per (workspace_id, record_id).
DELETE FROM public.dggi_records
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY workspace_id, record_id
             ORDER BY created_at ASC NULLS LAST
           ) AS rn
    FROM public.dggi_records
    WHERE record_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Step 2: Add partial unique index so future duplicates are rejected at DB level.
CREATE UNIQUE INDEX IF NOT EXISTS dggi_records_workspace_record_id_unique
  ON public.dggi_records (workspace_id, record_id)
  WHERE record_id IS NOT NULL;

-- CLR-15: Backfill dggi_closure_records for dggi_records rows that are closed
-- (closure_by IS NOT NULL) but have no corresponding closure snapshot yet.
-- This covers NIR-137..140 and any other legacy/seeded closed cases.

INSERT INTO public.dggi_closure_records (
  id,
  workspace_id,
  record_id,
  source_record_id,
  is_ir,
  "group",
  intel_source,
  date_of_receipt,
  taxpayer_name,
  gstins,
  file_no,
  date_of_initiation,
  intel_approved_date,
  mode_of_initiation,
  intelligence_action_date,
  handling_io_sio,
  issue_involved,
  latest_status,
  detection_amount,
  recovery_itc,
  recovery_cash,
  digit_id,
  bo_id,
  hsn_code,
  closure_by,
  closure_reason,
  transferred_to,
  due_date,
  date_of_ir,
  date_of_non_ir,
  converted_from_non_ir,
  created_at
)
SELECT
  gen_random_uuid(),
  r.workspace_id,
  -- Synthesize a placeholder closure record_id (will not collide with sequence-generated ones)
  CASE WHEN r.is_ir THEN 'CLR-LEGACY-' ELSE 'CNR-LEGACY-' END || r.record_id,
  r.record_id,
  r.is_ir,
  r."group",
  r.intel_source,
  r.date_of_receipt,
  r.taxpayer_name,
  r.gstins,
  r.file_no,
  r.date_of_initiation,
  r.intel_approved_date,
  r.mode_of_initiation,
  r.intelligence_action_date,
  r.handling_io_sio,
  r.issue_involved,
  r.latest_status,
  r.detection_amount,
  r.recovery_itc,
  r.recovery_cash,
  r.digit_id,
  r.bo_id,
  r.hsn_code,
  r.closure_by,
  r.closure_reason,
  r.transferred_to,
  r.due_date,
  r.date_of_ir,
  r.date_of_non_ir,
  r.converted_from_non_ir,
  r.created_at
FROM public.dggi_records r
WHERE r.closure_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.dggi_closure_records c
    WHERE c.workspace_id = r.workspace_id
      AND c.source_record_id = r.record_id
  );

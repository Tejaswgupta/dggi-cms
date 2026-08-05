-- Ingest NIR-137 through NIR-140 (Non-IR cases) and IR-93 (IR case, converted from NIR-137).
-- Source: aa.csv export dated 2026-08-04/05.
-- All records belong to workspace c973a08e-74a8-4aa4-b52a-850ef16adfb3.

-- ── Non-IR cases (is_ir = false) ──────────────────────────────────────────────

insert into public.dggi_records (
  id, workspace_id, intel_source, date_of_receipt,
  taxpayer_name, gstins, file_no,
  date_of_initiation, intel_approved_date, mode_of_initiation,
  intelligence_action_date, issue_involved, latest_status,
  pr_adg_comments, is_ir, created_at,
  "group", due_date, record_id,
  hsn_code, closure_by, date_of_ir, date_of_non_ir,
  detection_amount, recovery_itc, recovery_cash,
  digit_id, bo_id, converted_from_non_ir,
  assigned_user_id, handling_io_sio, transferred_to, sio_name,
  closure_reason, created_by, created_by_name, legacy_non_ir_no
)
values

  -- NIR-137 — M/s. Reliance Transport & Travels Pvt. Ltd. (closure_by = Convert to IR)
  (
    '158dbae6-6adb-4353-9316-73d3fe4a3624'::uuid,
    'c973a08e-74a8-4aa4-b52a-850ef16adfb3',
    'Group',
    '2026-08-04',
    'M/s. Reliance Transport & Travels Pvt. Ltd.',
    '27AAACR2380M1Z5',
    'DGGI/INT/INTL/458/2026-Gr E-O/o Pr ADG-DGGI-ZU-MUMBAI',
    '2026-05-08',
    '2026-05-19',
    'Summons',
    null,
    'Misclassification',
    'Convert to IR',
    null,
    false,
    '2026-08-04 09:19:46.563618+00',
    'Group A',
    '2026-08-04',
    'NIR-137-26-27',
    null,
    'Convert to IR',
    null,
    '2026-08-04',
    null, null, null,
    null, null,
    null,
    'bebc7167-6f7b-4ace-8fb6-2736488ab774'::uuid,
    null,
    null,
    'Ajay Singh',
    null,
    'bebc7167-6f7b-4ace-8fb6-2736488ab774'::uuid,
    'Ajay Singh',
    null
  ),

  -- NIR-138 — M/s Vishal shipping agency Pvt. Ltd.
  (
    '01b826d5-d2e4-4681-88b2-6f819f45edcf'::uuid,
    'c973a08e-74a8-4aa4-b52a-850ef16adfb3',
    'Group',
    '2026-08-04',
    'M/s Vishal shipping agency Pvt. Ltd.',
    '27AABCV6455C1ZD, 27AAYFV3004B1Z7',
    'DGGI/INT/INTL/611/2026-Gr A-O/o Pr. ADG-DGGI-ZU-MUMBAI',
    '2026-07-10',
    '2026-07-03',
    'Inspection',
    '2026-07-10',
    'RCM not paid on Import of Service',
    null,
    null,
    false,
    '2026-08-04 10:11:13.22466+00',
    'Group A',
    null,
    'NIR-138-26-27',
    null,
    null,
    null,
    '2026-08-04',
    null, null, null,
    null, null,
    null,
    'a54dc9d6-2528-4828-891b-111d1aebef76'::uuid,
    null,
    null,
    'S. Manikanta',
    null,
    'a54dc9d6-2528-4828-891b-111d1aebef76'::uuid,
    'S. Manikanta',
    null
  ),

  -- NIR-139 — (no taxpayer name)
  (
    '1ff0ac5c-d5b6-4a6c-8b73-fb8c29933978'::uuid,
    'c973a08e-74a8-4aa4-b52a-850ef16adfb3',
    'Group',
    '2026-08-04',
    null,
    null,
    'DGGI/INT/INTL/705/2026-GrB-O/o Pr ADG-DGGI-ZU-MUMBAI',
    '2026-08-04',
    null,
    null,
    null,
    'Non-payment of GST under RCM.',
    null,
    null,
    false,
    '2026-08-04 10:17:07.744597+00',
    'Group B',
    null,
    'NIR-139-26-27',
    null,
    null,
    null,
    '2026-08-04',
    null, null, null,
    null, null,
    null,
    '0dd0b22e-7415-417f-bce5-8ff93382c425'::uuid,
    null,
    null,
    'Utsav',
    null,
    '0dd0b22e-7415-417f-bce5-8ff93382c425'::uuid,
    'Utsav',
    null
  ),

  -- NIR-140 — (no taxpayer name)
  (
    '5d50d8d6-93b6-45bf-9682-4ee08c7d6b89'::uuid,
    'c973a08e-74a8-4aa4-b52a-850ef16adfb3',
    'Group',
    '2026-08-04',
    null,
    null,
    'DGGI/INT/INTL/705/2026-Gr B-O/o Pr ADG-DGGI-ZU-MUMBAI',
    '2026-08-04',
    null,
    null,
    null,
    'Non-payment of GST under RCM.',
    null,
    null,
    false,
    '2026-08-04 10:27:55.315061+00',
    'Group B',
    null,
    'NIR-140-26-27',
    null,
    null,
    null,
    '2026-08-04',
    null, null, null,
    null, null,
    null,
    '0dd0b22e-7415-417f-bce5-8ff93382c425'::uuid,
    null,
    null,
    'Utsav',
    null,
    '0dd0b22e-7415-417f-bce5-8ff93382c425'::uuid,
    'Utsav',
    null
  )

on conflict (id) do nothing;


-- ── IR-93 — converted from NIR-137 (is_ir = true) ────────────────────────────

insert into public.dggi_records (
  id, workspace_id, intel_source, date_of_receipt,
  taxpayer_name, gstins, file_no,
  date_of_initiation, intel_approved_date, mode_of_initiation,
  intelligence_action_date, issue_involved, latest_status,
  pr_adg_comments, is_ir, created_at,
  "group", due_date, record_id,
  hsn_code, closure_by, date_of_ir, date_of_non_ir,
  detection_amount, recovery_itc, recovery_cash,
  digit_id, bo_id, converted_from_non_ir,
  assigned_user_id, handling_io_sio, transferred_to, sio_name,
  closure_reason, created_by, created_by_name, legacy_non_ir_no
)
values
  (
    'fb68745b-de4c-450f-b727-daafa8ad5564'::uuid,
    'c973a08e-74a8-4aa4-b52a-850ef16adfb3',
    'Group',
    '2026-08-04',
    'M/s. Reliance Transport & Travels Pvt. Ltd.',
    '27AAACR2380M1Z5',
    'DGGI/INT/INTL/458/2026-Gr E-O/o Pr ADG-DGGI-ZU-MUMBAI',
    '2026-08-04',
    '2026-05-19',
    'Summons',
    null,
    'Misclassification',
    null,
    null,
    true,
    '2026-08-04 09:50:10.080735+00',
    'Group A',
    null,
    '93/GST/2026-27',
    null,
    null,
    '2026-08-04',
    null,
    null, null, null,
    null, null,
    'NIR-137-26-27',
    'bebc7167-6f7b-4ace-8fb6-2736488ab774'::uuid,
    null,
    null,
    'Ajay Singh',
    null,
    'bebc7167-6f7b-4ace-8fb6-2736488ab774'::uuid,
    'Ajay Singh',
    null
  )
on conflict (id) do nothing;


-- ── Advance sequences past the newly inserted records ────────────────────────

-- -- NIR: last inserted was 140 → next = 141
-- insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
-- values ('c973a08e-74a8-4aa4-b52a-850ef16adfb3'::uuid, 'NIR', '26-27', 141)
-- on conflict (workspace_id, prefix, fy)
-- do update set next_val = greatest(record_id_sequences.next_val, excluded.next_val);

-- -- IR: last inserted was 93 → next = 94 (already set; guard with greatest)
-- insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
-- values ('c973a08e-74a8-4aa4-b52a-850ef16adfb3'::uuid, 'IR', '2026-27', 94)
-- on conflict (workspace_id, prefix, fy)
-- do update set next_val = greatest(record_id_sequences.next_val, excluded.next_val);

-- Seed record_id_sequences from existing data so new inserts continue from
-- the correct next value rather than restarting at 001.
--
-- Each block parses the sequence number out of record_id using the format
-- specific to that register, then sets next_val = max(seq) + 1 per workspace+FY.
-- Records with NULL or unparseable record_ids are ignored.
--
-- Run AFTER 20260730000001_record_id_sequences.sql.

do $$
declare
  r record;
begin

  -- ── Standard format: {PREFIX}/{NNN}/{YY-YY} ──────────────────────────────────
  -- Covers: ARR, PAR, SCN, PRA, PRN, STR, ALC, SZR, EVR, DFL, RPC, MOC,
  --         RPD, IOS, NIR_CASE (dggi_non_ir_case_records uses NIR/{NNN}/{YY-YY})

  -- ARR — dggi_arrest_records
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           max(split_part(record_id, '/', 2)::integer) as max_seq
    from dggi_arrest_records
    where record_id ~ '^ARR/[0-9]+/[0-9]{2}-[0-9]{2}$'
    group by workspace_id, fy
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id::uuid, 'ARR', r.fy, r.max_seq + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;

  -- PAR — dggi_provisional_attachment_records (next entry: 166)
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  values ('e27632d5-19dc-49e6-92ec-df9a86567b40'::uuid, 'PAR', '26-27', 166)
  on conflict (workspace_id, prefix, fy)
  do update set next_val = excluded.next_val;

  -- SCN — dggi_scn_records
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           max(split_part(record_id, '/', 2)::integer) as max_seq
    from dggi_scn_records
    where record_id ~ '^SCN/[0-9]+/[0-9]{2}-[0-9]{2}$'
    group by workspace_id, fy
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id::uuid, 'SCN', r.fy, r.max_seq + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;

  -- PRA — dggi_prosecution_arrest_records (next entry: 55)
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  values ('e27632d5-19dc-49e6-92ec-df9a86567b40'::uuid, 'PRA', '26-27', 55)
  on conflict (workspace_id, prefix, fy)
  do update set next_val = excluded.next_val;

  -- PRN — dggi_prosecution_non_arrest_records (next entry: 55)
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  values ('e27632d5-19dc-49e6-92ec-df9a86567b40'::uuid, 'PRN', '26-27', 55)
  on conflict (workspace_id, prefix, fy)
  do update set next_val = excluded.next_val;

  -- STR — dggi_str_records
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           max(split_part(record_id, '/', 2)::integer) as max_seq
    from dggi_str_records
    where record_id ~ '^STR/[0-9]+/[0-9]{2}-[0-9]{2}$'
    group by workspace_id, fy
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id::uuid, 'STR', r.fy, r.max_seq + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;

  -- ALC — dggi_alert_circular_records
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           max(split_part(record_id, '/', 2)::integer) as max_seq
    from dggi_alert_circular_records
    where record_id ~ '^ALC/[0-9]+/[0-9]{2}-[0-9]{2}$'
    group by workspace_id, fy
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id::uuid, 'ALC', r.fy, r.max_seq + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;



  -- RPC — dggi_report_compliance_records
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           max(split_part(record_id, '/', 2)::integer) as max_seq
    from dggi_report_compliance_records
    where record_id ~ '^RPC/[0-9]+/[0-9]{2}-[0-9]{2}$'
    group by workspace_id, fy
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id::uuid, 'RPC', r.fy, r.max_seq + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;

  -- MOC — dggi_modus_operandi_records
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           max(split_part(record_id, '/', 2)::integer) as max_seq
    from dggi_modus_operandi_records
    where record_id ~ '^MOC/[0-9]+/[0-9]{2}-[0-9]{2}$'
    group by workspace_id, fy
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id::uuid, 'MOC', r.fy, r.max_seq + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;

  -- RPD — dggi_intel_rapid_records
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           max(split_part(record_id, '/', 2)::integer) as max_seq
    from dggi_intel_rapid_records
    where record_id ~ '^RPD/[0-9]+/[0-9]{2}-[0-9]{2}$'
    group by workspace_id, fy
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id::uuid, 'RPD', r.fy, r.max_seq + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;

  -- IOS — dggi_intel_other_source_records
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           max(split_part(record_id, '/', 2)::integer) as max_seq
    from dggi_intel_other_source_records
    where record_id ~ '^IOS/[0-9]+/[0-9]{2}-[0-9]{2}$'
    group by workspace_id, fy
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id::uuid, 'IOS', r.fy, r.max_seq + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;

  -- NIR_CASE — dggi_non_ir_case_records  (NIR/{NNN}/{YY-YY})
  -- Uses key "NIR_CASE" to avoid sharing a counter with dggi_records NIR cases.
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           max(split_part(record_id, '/', 2)::integer) as max_seq
    from dggi_non_ir_case_records
    where record_id ~ '^NIR/[0-9]+/[0-9]{2}-[0-9]{2}$'
    group by workspace_id, fy
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id::uuid, 'NIR_CASE', r.fy, r.max_seq + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;

  -- ── IR cases: {NNN}/GST/{YYYY-YY}  ─────────────────────────────────────────
  -- Sequence key: prefix='IR', fy='2026-27' — next entry: 93
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  values ('e27632d5-19dc-49e6-92ec-df9a86567b40'::uuid, 'IR', '2026-27', 93)
  on conflict (workspace_id, prefix, fy)
  do update set next_val = excluded.next_val;

  -- ── NON-IR cases: NIR-{NNN}-{YY-YY}  ───────────────────────────────────────
  -- Sequence key: prefix='NIR', fy='26-27' — next entry: 137 overall (82 from Apr 2026)
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  values ('e27632d5-19dc-49e6-92ec-df9a86567b40'::uuid, 'NIR', '26-27', 137)
  on conflict (workspace_id, prefix, fy)
  do update set next_val = excluded.next_val;

  -- ── Closure records ──────────────────────────────────────────────────────────
  -- FP format:  DGGI/MZU/CR/FP/{YYYY-YY}/{NNN}  → prefix='CR_FP',  fy=YYYY-YY
  -- NSP format: DGGI/MZU/CR-NSP-{YYYY-YY}/{NNN} → prefix='CR_NSP', fy=YYYY-YY

  -- CR_FP: DGGI/MZU/CR/FP/2026-27/{NNN} — next entry: 028
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  values ('e27632d5-19dc-49e6-92ec-df9a86567b40'::uuid, 'CR_FP', '2026-27', 28)
  on conflict (workspace_id, prefix, fy)
  do update set next_val = excluded.next_val;

  -- CR_NSP: DGGI/MZU/CR-NSP-{YYYY-YY}/{NNN} — next entry: 005
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  values ('e27632d5-19dc-49e6-92ec-df9a86567b40'::uuid, 'CR_NSP', '2026-27', 5)
  on conflict (workspace_id, prefix, fy)
  do update set next_val = excluded.next_val;

end $$;

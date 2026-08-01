-- Seed per-competency SCN sequences (AD-DD, SIO, ADC-JC) from current row counts.
-- These track UI-created records independently per competency per FY.
-- Bulk-imported rows use raw SCN numbers as record_id and are excluded by the
-- '^[0-9]{2}/Grp-' pattern check (they don't match, so count starts at 1 for
-- each competency if no UI records exist yet).

do $$
declare
  r record;
begin
  -- AD/DD Competency → prefix AD-DD
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           count(*)::integer as cnt
    from dggi_scn_records
    where competency = 'AD/DD Competency'
      and record_id ~ '^[0-9]'
      and record_id ~ '/Grp-'
    group by workspace_id, split_part(record_id, '/', 3)
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id, 'AD-DD', r.fy, r.cnt + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;

  -- SIO Competency → prefix SIO
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           count(*)::integer as cnt
    from dggi_scn_records
    where competency = 'SIO Competency'
      and record_id ~ '^[0-9]'
      and record_id ~ '/Grp-'
    group by workspace_id, split_part(record_id, '/', 3)
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id, 'SIO', r.fy, r.cnt + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;

  -- JC/ADC Competency → prefix ADC-JC
  for r in
    select workspace_id,
           split_part(record_id, '/', 3) as fy,
           count(*)::integer as cnt
    from dggi_scn_records
    where competency = 'JC/ADC Competency'
      and record_id ~ '^[0-9]'
      and record_id ~ '/Grp-'
    group by workspace_id, split_part(record_id, '/', 3)
  loop
    insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
    values (r.workspace_id, 'ADC-JC', r.fy, r.cnt + 1)
    on conflict (workspace_id, prefix, fy)
    do update set next_val = excluded.next_val;
  end loop;
end;
$$;

-- Seed per-competency SCN sequences (AD-DD, SIO, ADC-JC) from current row counts.
-- These track UI-created records independently per competency per FY.
-- Bulk-imported rows use raw SCN numbers as record_id and are excluded by the
-- '^[0-9]{2}/Grp-' pattern check (they don't match, so count starts at 1 for
-- each competency if no UI records exist yet).

do $$
begin
  -- JC/ADC Competency (ADD/JD level) → prefix ADC-JC — next entry: 19
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  select distinct workspace_id, 'ADC-JC', '26-27', 19
  from dggi_scn_records
  on conflict (workspace_id, prefix, fy)
  do update set next_val = excluded.next_val;

  -- AD/DD Competency → prefix AD-DD — next entry: 11
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  select distinct workspace_id, 'AD-DD', '26-27', 11
  from dggi_scn_records
  on conflict (workspace_id, prefix, fy)
  do update set next_val = excluded.next_val;

  -- SIO Competency → prefix SIO — next entry: 02
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  select distinct workspace_id, 'SIO', '26-27', 2
  from dggi_scn_records
  on conflict (workspace_id, prefix, fy)
  do update set next_val = excluded.next_val;
end;
$$;

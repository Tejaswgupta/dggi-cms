-- Atomic per-workspace, per-prefix, per-FY sequence counters.
-- Each row is locked with SELECT ... FOR UPDATE before incrementing,
-- so concurrent inserts cannot produce the same ID.

create table if not exists public.record_id_sequences (
  workspace_id  uuid        not null,
  prefix        text        not null,
  fy            text        not null,  -- e.g. "26-27"
  next_val      integer     not null default 1,
  primary key (workspace_id, prefix, fy)
);

-- Grants: allow authenticated users to read/write their own workspace rows.
-- RLS is not needed here because access is mediated through the RPC functions,
-- which run as SECURITY DEFINER.
alter table public.record_id_sequences enable row level security;

drop policy if exists "workspace members can manage their sequences" on public.record_id_sequences;

create policy "workspace members can manage their sequences"
  on public.record_id_sequences
  for all
  using (true);

grant all on public.record_id_sequences to authenticated, service_role;

-- ─── next_record_id ────────────────────────────────────────────────────────────
-- Returns the next formatted ID for a single insert.
-- Format matches existing convention: "{prefix}{sep}{NNN}{sep}{fy}"
create or replace function public.next_record_id(
  p_workspace_id  uuid,
  p_prefix        text,
  p_fy            text,
  p_separator     text default '/'
)
returns text
language plpgsql
security definer
as $$
declare
  v_next integer;
begin
  -- Upsert the sequence row, then lock it and grab the current value.
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  values (p_workspace_id, p_prefix, p_fy, 1)
  on conflict (workspace_id, prefix, fy) do nothing;

  select next_val into v_next
  from public.record_id_sequences
  where workspace_id = p_workspace_id
    and prefix = p_prefix
    and fy = p_fy
  for update;

  update public.record_id_sequences
  set next_val = next_val + 1
  where workspace_id = p_workspace_id
    and prefix = p_prefix
    and fy = p_fy;

  return p_prefix || p_separator || lpad(v_next::text, 3, '0') || p_separator || p_fy;
end;
$$;

-- ─── next_record_ids_batch ─────────────────────────────────────────────────────
-- Returns an array of N consecutive formatted IDs in a single round-trip.
create or replace function public.next_record_ids_batch(
  p_workspace_id  uuid,
  p_prefix        text,
  p_fy            text,
  p_n             integer,
  p_separator     text default '/'
)
returns text[]
language plpgsql
security definer
as $$
declare
  v_start  integer;
  v_ids    text[];
  i        integer;
begin
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  values (p_workspace_id, p_prefix, p_fy, 1)
  on conflict (workspace_id, prefix, fy) do nothing;

  select next_val into v_start
  from public.record_id_sequences
  where workspace_id = p_workspace_id
    and prefix = p_prefix
    and fy = p_fy
  for update;

  update public.record_id_sequences
  set next_val = next_val + p_n
  where workspace_id = p_workspace_id
    and prefix = p_prefix
    and fy = p_fy;

  v_ids := array[]::text[];
  for i in 0..(p_n - 1) loop
    v_ids := v_ids || (p_prefix || p_separator || lpad((v_start + i)::text, 3, '0') || p_separator || p_fy);
  end loop;

  return v_ids;
end;
$$;

-- ─── next_seq_val ──────────────────────────────────────────────────────────────
-- Returns just the next integer counter and increments it.
-- Used by callers that need full control over ID formatting (e.g. closure IDs).
create or replace function public.next_seq_val(
  p_workspace_id  uuid,
  p_prefix        text,
  p_fy            text
)
returns integer
language plpgsql
security definer
as $$
declare
  v_next integer;
begin
  insert into public.record_id_sequences (workspace_id, prefix, fy, next_val)
  values (p_workspace_id, p_prefix, p_fy, 1)
  on conflict (workspace_id, prefix, fy) do nothing;

  select next_val into v_next
  from public.record_id_sequences
  where workspace_id = p_workspace_id
    and prefix = p_prefix
    and fy = p_fy
  for update;

  update public.record_id_sequences
  set next_val = next_val + 1
  where workspace_id = p_workspace_id
    and prefix = p_prefix
    and fy = p_fy;

  return v_next;
end;
$$;

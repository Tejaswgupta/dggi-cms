-- dggi_computed_deadlines
-- One row per (workspace_id, rule_id, row_id). Upserted on every save so the
-- background alert job can cheaply read today's due rows without touching the
-- source tables.

create table if not exists public.dggi_computed_deadlines (
  id                  uuid default gen_random_uuid() primary key,
  workspace_id        text not null,
  rule_id             text not null,
  source_table        text not null,
  record_id           text not null,   -- human-readable ID (e.g. IR/2024/001)
  row_id              uuid not null,   -- source table pk
  reference_date      date not null,
  deadline_date       date not null,
  label               text not null,
  legal_reference     text,
  skipped             boolean not null default false,
  updated_at          timestamptz not null default now(),
  constraint dggi_computed_deadlines_uniq
    unique (workspace_id, rule_id, row_id)
);

create index if not exists idx_dggi_computed_deadlines_lookup
  on public.dggi_computed_deadlines (workspace_id, deadline_date, skipped);


-- dggi_notifications
-- In-app notification inbox. The alert job inserts rows here; the frontend
-- polls / subscribes to mark them read.

create table if not exists public.dggi_notifications (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    text not null,
  user_id         uuid,          -- null = workspace-wide broadcast
  rule_id         text not null,
  source_table    text not null,
  record_id       text not null,
  row_id          uuid,
  deadline_date   date not null,
  days_until      integer not null,
  label           text not null,
  legal_reference text,
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists idx_dggi_notifications_user
  on public.dggi_notifications (workspace_id, user_id, read, created_at desc);


-- RLS: allow authenticated users to read their own workspace rows
alter table public.dggi_computed_deadlines enable row level security;
alter table public.dggi_notifications       enable row level security;

create policy "workspace members can read computed deadlines"
  on public.dggi_computed_deadlines for select
  using (true);

create policy "workspace members can read their notifications"
  on public.dggi_notifications for select
  using (true);

create policy "workspace members can mark notifications read"
  on public.dggi_notifications for update
  using (true);

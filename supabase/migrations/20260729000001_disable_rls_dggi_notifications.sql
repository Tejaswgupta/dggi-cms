drop policy if exists "workspace members can read their notifications" on public.dggi_notifications;
drop policy if exists "workspace members can mark notifications read" on public.dggi_notifications;

alter table public.dggi_notifications disable row level security;

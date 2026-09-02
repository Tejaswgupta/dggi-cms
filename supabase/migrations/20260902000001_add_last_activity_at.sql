ALTER TABLE public.votum_users
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

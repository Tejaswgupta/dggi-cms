alter table dggi_records
  add column if not exists pr_adg_comments_updated_at timestamptz;

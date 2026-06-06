alter table dggi_intel_rapid_records
  add column if not exists sender_email text,
  add column if not exists sender_mobile text;

alter table dggi_intel_rapid_records
  drop column if exists sender_email_mobile;

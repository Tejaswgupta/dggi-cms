alter table dggi_provisional_attachment_records
  add column if not exists bank_name text,
  add column if not exists bank_ifsc text;

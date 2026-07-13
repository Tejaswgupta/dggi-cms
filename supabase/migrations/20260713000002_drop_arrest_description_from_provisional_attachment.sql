alter table dggi_provisional_attachment_records
  drop column if exists arrest,
  drop column if exists description_of_property;

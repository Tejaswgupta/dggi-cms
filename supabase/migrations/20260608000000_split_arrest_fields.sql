alter table dggi_arrest_records
  add column if not exists arrested_name        text,
  add column if not exists arrested_designation text,
  add column if not exists arrested_age         text,
  add column if not exists relative_name        text,
  add column if not exists relative_address     text,
  add column if not exists relative_tel         text;

update dggi_arrest_records
  set arrested_name = person_details,
      relative_name = relative_intimation
where person_details is not null
   or relative_intimation is not null;

alter table dggi_arrest_records
  drop column if exists person_details,
  drop column if exists relative_intimation;

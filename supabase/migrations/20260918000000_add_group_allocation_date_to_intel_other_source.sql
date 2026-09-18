-- Add group_allocation_date to dggi_intel_other_source_records so it matches
-- the Rapid/STR data model, enabling the same non_ir_creation_deadline rule.
alter table public.dggi_intel_other_source_records
  add column if not exists group_allocation_date date;

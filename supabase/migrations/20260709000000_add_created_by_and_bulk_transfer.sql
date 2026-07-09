-- Add created_by / created_by_name to all user-facing DGGI tables.
-- These fields are write-once (set on insert, never updated by transfers or edits).

ALTER TABLE dggi_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_scn_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_arrest_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_provisional_attachment_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_closure_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_alert_circular_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_cpgram_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_dfl_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_evidence_room_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_incident_report_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_informer_reward_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_intel_rapid_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_intel_other_source_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_intel_closure_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_modus_operandi_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_non_ir_case_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_prosecution_arrest_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_prosecution_non_arrest_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_report_compliance_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_seizure_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

ALTER TABLE dggi_str_records
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_by_name text;

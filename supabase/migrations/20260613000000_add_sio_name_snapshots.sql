-- Snapshot officer names at time of assignment so historical records survive designation handovers.
-- Convention: <field>_name holds the snapshotted display name for <field> (which holds a user ID).
-- dggi_records.handling_io_sio_name already handled in 20260612000000.

-- Add snapshot columns
ALTER TABLE dggi_closure_records                 ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_scn_records                     ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_arrest_records                  ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_prosecution_arrest_records      ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_prosecution_non_arrest_records  ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_provisional_attachment_records  ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_incident_report_records         ADD COLUMN IF NOT EXISTS sio_name text;
-- dggi_alert_circular_records and dggi_non_ir_case_records had a redundant sio_name column
-- storing a user ID (duplicate of sio). Drop it, then add sio_name as the text snapshot.
ALTER TABLE dggi_alert_circular_records DROP COLUMN IF EXISTS sio_name;
ALTER TABLE dggi_non_ir_case_records    DROP COLUMN IF EXISTS sio_name;
ALTER TABLE dggi_alert_circular_records ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_non_ir_case_records    ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_intel_rapid_records             ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_intel_other_source_records      ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_str_records                     ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_dfl_records                     ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_informer_reward_records         ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_modus_operandi_records          ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_cpgram_records                  ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_cpgram_records                  ADD COLUMN IF NOT EXISTS handling_officer_name text;
ALTER TABLE dggi_seizure_records                 ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_seizure_records                 ADD COLUMN IF NOT EXISTS seized_by_name text;
ALTER TABLE dggi_evidence_room_records           ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_evidence_room_records           ADD COLUMN IF NOT EXISTS seized_by_name text;
ALTER TABLE dggi_report_compliance_records       ADD COLUMN IF NOT EXISTS sio_name text;
ALTER TABLE dggi_report_compliance_records       ADD COLUMN IF NOT EXISTS submitted_by_name text;

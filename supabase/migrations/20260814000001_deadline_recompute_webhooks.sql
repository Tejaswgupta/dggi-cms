-- Trigger-based webhooks that recompute dggi_computed_deadlines whenever a
-- source record changes. Uses x-internal-cron: 1 so no secret is hardcoded.
-- Replace YOUR_DOMAIN with the deployed app URL before running.

CREATE OR REPLACE TRIGGER deadline_recompute_provisional_attachment
AFTER INSERT OR UPDATE OR DELETE ON dggi_provisional_attachment_records
FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
  'https://app.aegismzu.in/api/dggi/deadline-alerts',
  'POST',
  '{"Content-Type":"application/json","x-internal-cron":"1"}',
  '{"table":"dggi_provisional_attachment_records"}',
  '5000'
);

CREATE OR REPLACE TRIGGER deadline_recompute_prosecution_arrest
AFTER INSERT OR UPDATE OR DELETE ON dggi_prosecution_arrest_records
FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
  'https://app.aegismzu.in/api/dggi/deadline-alerts',
  'POST',
  '{"Content-Type":"application/json","x-internal-cron":"1"}',
  '{"table":"dggi_prosecution_arrest_records"}',
  '5000'
);

CREATE OR REPLACE TRIGGER deadline_recompute_intel_rapid
AFTER INSERT OR UPDATE OR DELETE ON dggi_intel_rapid_records
FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
  'https://app.aegismzu.in/api/dggi/deadline-alerts',
  'POST',
  '{"Content-Type":"application/json","x-internal-cron":"1"}',
  '{"table":"dggi_intel_rapid_records"}',
  '5000'
);

CREATE OR REPLACE TRIGGER deadline_recompute_str
AFTER INSERT OR UPDATE OR DELETE ON dggi_str_records
FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
  'https://app.aegismzu.in/api/dggi/deadline-alerts',
  'POST',
  '{"Content-Type":"application/json","x-internal-cron":"1"}',
  '{"table":"dggi_str_records"}',
  '5000'
);

CREATE OR REPLACE TRIGGER deadline_recompute_records
AFTER INSERT OR UPDATE OR DELETE ON dggi_records
FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
  'https://app.aegismzu.in/api/dggi/deadline-alerts',
  'POST',
  '{"Content-Type":"application/json","x-internal-cron":"1"}',
  '{"table":"dggi_records"}',
  '5000'
);

-- Normalize closure_by = '' → NULL so the pending-dashboard query
-- (.is("closure_by", null)) correctly surfaces all open cases.
-- 40 NON-IR records were affected; write-path already coerces '' → NULL.
UPDATE dggi_records
SET closure_by = NULL
WHERE closure_by = '';

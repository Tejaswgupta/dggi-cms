-- Drop the CHECK constraint on dggi_records.mode_of_initiation.
--
-- mode_of_initiation is edited as a free-text/select field in the IR and NON-IR
-- registers, which are views over dggi_records. The constraint only permitted a
-- fixed enum (Letter/Email/Summons/Inspection/Search) plus NULL, so a blank field
-- (empty string) or any value outside that list rejected the row with error 23514.
-- The column is now unconstrained free text, consistent with how the registers
-- treat it.
ALTER TABLE dggi_records
  DROP CONSTRAINT IF EXISTS dggi_records_mode_of_initiation_check;

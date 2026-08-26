-- Rapid intel records had no captured receipt date (only created_at, which is
-- an unreliable deadline basis since row creation can lag actual receipt).
-- Add "Date of RAPID" so the ADG put-up deadline can be computed from it.
ALTER TABLE dggi_intel_rapid_records
  ADD COLUMN IF NOT EXISTS date_of_rapid date;

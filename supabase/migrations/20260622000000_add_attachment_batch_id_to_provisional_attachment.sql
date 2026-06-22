-- Add batch grouping column to provisional attachment records
ALTER TABLE dggi_provisional_attachment_records
  ADD COLUMN IF NOT EXISTS attachment_batch_id TEXT;

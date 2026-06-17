-- Link prosecution arrest records back to the source arrest case in dggi_arrest_records
ALTER TABLE dggi_prosecution_arrest_records
  ADD COLUMN IF NOT EXISTS linked_arrest_id UUID REFERENCES dggi_arrest_records(id) ON DELETE SET NULL;

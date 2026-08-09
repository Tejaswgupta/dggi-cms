-- SCN-12: Add scn_issuing_authority (uuid) + scn_issuing_authority_name (text snapshot)
-- to dggi_scn_records. sio/sio_name remain the handling/assigned officer fields.
ALTER TABLE public.dggi_scn_records
  ADD COLUMN IF NOT EXISTS scn_issuing_authority      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scn_issuing_authority_name text;

-- Add SIO_INT (Senior Intelligence Officer - Intelligence) role to votum_users constraint

ALTER TABLE public.votum_users
  DROP CONSTRAINT IF EXISTS votum_users_dggi_role_check;

ALTER TABLE public.votum_users
  ADD CONSTRAINT votum_users_dggi_role_check
  CHECK (
    dggi_role IS NULL OR
    dggi_role = ANY (ARRAY[
      'ADG'::text, 'DD_INT'::text,
      'DD'::text,  'AD'::text,
      'ADC'::text, 'JD'::text,
      'SIO'::text, 'IO'::text,
      'SIO_INT'::text
    ])
  );

-- Add DD_REPORTS to the allowed dggi_role values.
ALTER TABLE votum_users
  DROP CONSTRAINT IF EXISTS votum_users_dggi_role_check;

ALTER TABLE votum_users
  ADD CONSTRAINT votum_users_dggi_role_check
  CHECK (
    dggi_role IS NULL OR dggi_role = ANY (
      ARRAY['ADG','DD_INT','DD','AD','ADC','JD','SIO','IO','SIO_INT','DD_REPORTS']
    )
  );

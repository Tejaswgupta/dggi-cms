-- Add AD (Assistant Director, equiv. DD) and JD (Joint Director, equiv. ADC) to dggi_role

-- 1. Update CHECK constraint on votum_users
ALTER TABLE public.votum_users
  DROP CONSTRAINT IF EXISTS votum_users_dggi_role_check;

ALTER TABLE public.votum_users
  ADD CONSTRAINT votum_users_dggi_role_check
  CHECK (
    dggi_role IS NULL OR
    dggi_role = ANY (ARRAY[
      'ADG'::text, 'DD_INT'::text,
      'DD'::text, 'AD'::text,
      'ADC'::text, 'JD'::text,
      'SIO'::text, 'IO'::text
    ])
  );

-- 2. Update dggi_can_access_record (text overload)
CREATE OR REPLACE FUNCTION public.dggi_can_access_record(
  p_workspace_id text,
  p_group text,
  p_handling_io_sio text
) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.votum_users u
    WHERE u.id = auth.uid()
      AND u.workspace_id::text = p_workspace_id
      AND (
        u.dggi_role IN ('ADG', 'DD_INT')
        OR (
          u.dggi_role IN ('ADC', 'JD', 'DD', 'AD')
          AND EXISTS (
            SELECT 1
            FROM public.dggi_user_group_assignments g
            WHERE g.user_id = u.id
              AND g.workspace_id = u.workspace_id
              AND g.group_name = p_group
          )
        )
        OR (
          u.dggi_role IN ('SIO', 'IO')
          AND (
            u.id::text = p_handling_io_sio
            OR u.name = p_handling_io_sio
          )
        )
      )
  );
$$;

-- 3. Update dggi_can_access_record (uuid overload)
CREATE OR REPLACE FUNCTION public.dggi_can_access_record(
  p_workspace_id text,
  p_group text,
  p_assigned_user_id uuid
) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.votum_users u
    WHERE u.id = auth.uid()
      AND u.workspace_id::text = p_workspace_id
      AND (
        u.dggi_role IN ('ADG', 'DD_INT')
        OR (
          u.dggi_role IN ('ADC', 'JD', 'DD', 'AD')
          AND EXISTS (
            SELECT 1
            FROM public.dggi_user_group_assignments g
            WHERE g.user_id = u.id
              AND g.workspace_id = u.workspace_id
              AND g.group_name = p_group
          )
        )
        OR (
          u.dggi_role IN ('SIO', 'IO')
          AND p_assigned_user_id = u.id
        )
      )
  );
$$;

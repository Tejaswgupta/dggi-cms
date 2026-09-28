-- Preview or atomically transfer assigned cases before removing a user profile.
CREATE OR REPLACE FUNCTION public.remove_user_with_case_transfer(
  p_user_id uuid,
  p_replacement_id uuid DEFAULT NULL,
  p_group text DEFAULT NULL,
  p_preview boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_workspace_id uuid;
  v_replacement public.votum_users%ROWTYPE;
  v_dggi_count integer;
  v_case_count integer;
  v_register_count integer := 0;
  v_rows integer;
  v_table text;
BEGIN
  SELECT workspace_id INTO v_workspace_id
  FROM public.votum_users
  WHERE id = auth.uid() AND dggi_role IN ('ADG', 'DD_INT');
  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot remove your own account';
  END IF;

  IF p_preview THEN
    PERFORM 1 FROM public.votum_users
    WHERE id = p_user_id AND workspace_id = v_workspace_id;
  ELSE
    PERFORM 1 FROM public.votum_users
    WHERE id = p_user_id AND workspace_id = v_workspace_id
    FOR UPDATE;
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in your workspace';
  END IF;

  SELECT count(*) INTO v_dggi_count
  FROM public.dggi_records
  WHERE workspace_id = v_workspace_id::text AND handling_io_sio = p_user_id;

  SELECT count(*) INTO v_case_count
  FROM public.votum_cases
  WHERE workspace_id = v_workspace_id
    AND (p_user_id = ANY(assigned_user_ids)
      OR (created_by = p_user_id
        AND cardinality(coalesce(assigned_user_ids, ARRAY[]::uuid[])) = 0));

  FOREACH v_table IN ARRAY ARRAY[
    'dggi_alert_circular_records', 'dggi_arrest_records',
    'dggi_incident_report_records', 'dggi_intel_other_source_records',
    'dggi_intel_rapid_records', 'dggi_modus_operandi_records',
    'dggi_non_ir_case_records', 'dggi_prosecution_arrest_records',
    'dggi_prosecution_non_arrest_records', 'dggi_provisional_attachment_records',
    'dggi_report_compliance_records', 'dggi_scn_records', 'dggi_str_records'
  ] LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE workspace_id = $1 AND sio = $2', v_table)
      INTO v_rows USING v_workspace_id::text, p_user_id;
    v_register_count := v_register_count + v_rows;
  END LOOP;
  SELECT v_register_count + count(*) INTO v_register_count
  FROM public.dggi_closure_records
  WHERE workspace_id = v_workspace_id::text AND handling_io_sio = p_user_id;
  SELECT v_register_count + count(*) INTO v_register_count
  FROM public.dggi_intel_rapid_records
  WHERE workspace_id = v_workspace_id::text AND assigned_user_id = p_user_id
    AND sio IS DISTINCT FROM p_user_id;

  IF p_preview THEN
    RETURN jsonb_build_object('dggi_cases', v_dggi_count, 'cases', v_case_count, 'dggi_registers', v_register_count);
  END IF;

  IF v_dggi_count + v_case_count + v_register_count > 0 AND p_replacement_id IS NULL THEN
    RAISE EXCEPTION 'Choose a replacement for the assigned cases and records';
  END IF;

  IF p_replacement_id IS NOT NULL THEN
    SELECT * INTO v_replacement FROM public.votum_users
    WHERE id = p_replacement_id
      AND id <> p_user_id
      AND workspace_id = v_workspace_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Replacement user not found in your workspace';
    END IF;

    IF v_dggi_count + v_register_count > 0 AND (
      v_replacement.dggi_role IS DISTINCT FROM 'SIO'
      OR p_group IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM public.dggi_user_group_assignments
        WHERE user_id = p_replacement_id
          AND workspace_id = v_workspace_id
          AND group_name = p_group
      )
    ) THEN
      RAISE EXCEPTION 'Choose an SIO with an assigned group';
    END IF;

    -- Move every directly assigned register row, including standalone records.
    FOREACH v_table IN ARRAY ARRAY[
      'dggi_alert_circular_records', 'dggi_arrest_records',
      'dggi_incident_report_records', 'dggi_modus_operandi_records',
      'dggi_non_ir_case_records', 'dggi_prosecution_arrest_records',
      'dggi_prosecution_non_arrest_records', 'dggi_provisional_attachment_records',
      'dggi_report_compliance_records', 'dggi_scn_records'
    ] LOOP
      EXECUTE format(
        'UPDATE public.%I SET sio = $1, sio_name = $2, "group" = $3 WHERE workspace_id = $4 AND sio = $5',
        v_table
      ) USING p_replacement_id, v_replacement.name, p_group, v_workspace_id::text, p_user_id;
    END LOOP;
    UPDATE public.dggi_str_records
    SET sio = p_replacement_id, sio_name = v_replacement.name, "group" = p_group,
      assigned_group = p_group, sio_group = p_group
    WHERE workspace_id = v_workspace_id::text AND sio = p_user_id;
    FOREACH v_table IN ARRAY ARRAY['dggi_intel_other_source_records', 'dggi_intel_rapid_records'] LOOP
      EXECUTE format(
        'UPDATE public.%I SET sio = $1, sio_name = $2, assigned_group = $3 WHERE workspace_id = $4 AND sio = $5',
        v_table
      ) USING p_replacement_id, v_replacement.name, p_group, v_workspace_id::text, p_user_id;
    END LOOP;
    UPDATE public.dggi_closure_records
    SET handling_io_sio = p_replacement_id, sio_name = v_replacement.name, "group" = p_group
    WHERE workspace_id = v_workspace_id::text AND handling_io_sio = p_user_id;
    UPDATE public.dggi_intel_rapid_records
    SET assigned_user_id = p_replacement_id, assigned_group = p_group
    WHERE workspace_id = v_workspace_id::text AND assigned_user_id = p_user_id;

    UPDATE public.dggi_records
    SET handling_io_sio = p_replacement_id, sio_name = v_replacement.name, "group" = p_group
    WHERE workspace_id = v_workspace_id::text AND handling_io_sio = p_user_id;
    UPDATE public.dggi_computed_deadlines
    SET sio_user_id = p_replacement_id::text, officer_name = v_replacement.name, group_name = p_group
    WHERE workspace_id = v_workspace_id::text AND sio_user_id = p_user_id::text;

    UPDATE public.votum_cases
    SET assigned_user_ids = CASE
      WHEN p_replacement_id = ANY(assigned_user_ids) THEN array_remove(assigned_user_ids, p_user_id)
      ELSE array_replace(assigned_user_ids, p_user_id, p_replacement_id)
    END
    WHERE workspace_id = v_workspace_id AND p_user_id = ANY(assigned_user_ids);

    UPDATE public.votum_cases
    SET assigned_user_ids = ARRAY[p_replacement_id]
    WHERE workspace_id = v_workspace_id AND created_by = p_user_id
      AND cardinality(coalesce(assigned_user_ids, ARRAY[]::uuid[])) = 0;
  END IF;

  -- Guest access is not a case assignment, but should not retain a removed ID.
  UPDATE public.votum_cases
  SET guest_user_ids = array_remove(guest_user_ids, p_user_id)
  WHERE workspace_id = v_workspace_id AND p_user_id = ANY(guest_user_ids);

  -- The creator FK otherwise blocks profile removal. Keep the case and its assignment.
  UPDATE public.votum_cases
  SET created_by = NULL
  WHERE workspace_id = v_workspace_id AND created_by = p_user_id;

  DELETE FROM public.votum_users
  WHERE id = p_user_id AND workspace_id = v_workspace_id;

  RETURN jsonb_build_object('dggi_cases', v_dggi_count, 'cases', v_case_count, 'dggi_registers', v_register_count);
END;
$$;

REVOKE ALL ON FUNCTION public.remove_user_with_case_transfer(uuid, uuid, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_user_with_case_transfer(uuid, uuid, text, boolean) TO authenticated;

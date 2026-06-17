-- Seed 5 SIO users per group (Group A–E) in ajinkya@gov.in's workspace.
-- Run this in the Supabase SQL editor (requires service role / postgres access).
-- auth.users rows use gen_random_uuid(); votum_users rows link via the same uuid.

DO $$
DECLARE
  v_workspace_id uuid;
  v_user_id      uuid;
  v_group        text;
  v_idx          int;
  v_name         text;
  v_email        text;
  v_groups       text[] := ARRAY['Group A', 'Group B', 'Group C', 'Group D', 'Group E'];
BEGIN
  -- Resolve workspace from ajinkya@gov.in's votum_users row
  SELECT workspace_id INTO v_workspace_id
  FROM public.votum_users
  WHERE email = 'ajinkya@gov.in'
  LIMIT 1;

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'No workspace found for ajinkya@gov.in — check the email and try again.';
  END IF;

  RAISE NOTICE 'Seeding into workspace: %', v_workspace_id;

  FOREACH v_group IN ARRAY v_groups LOOP
    FOR v_idx IN 1..5 LOOP
      -- Derive a stable slug: "group-a-sio-1", "group-a-sio-2", …
      v_name  := v_group || ' SIO ' || v_idx;
      -- email: group-a-sio-1@dggi.gov.in  (replace spaces → hyphens, lowercase)
      v_email := lower(replace(v_group, ' ', '-')) || '-sio-' || v_idx || '@dggi.gov.in';

      v_user_id := gen_random_uuid();

      -- Insert into auth.users so login is possible (password: Dggi@1234)
      INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        aud,
        role
      ) VALUES (
        v_user_id,
        v_email,
        crypt('Dggi@1234', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', v_name, 'workspace_id', v_workspace_id),
        now(),
        now(),
        'authenticated',
        'authenticated'
      )
      ON CONFLICT (email) DO NOTHING;

      -- Fetch the real id in case the row already existed
      SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

      -- Insert into votum_users
      INSERT INTO public.votum_users (
        id,
        email,
        name,
        workspace_id,
        role,
        dggi_role,
        created_at
      ) VALUES (
        v_user_id,
        v_email,
        v_name,
        v_workspace_id,
        'user',
        'SIO',
        now()
      )
      ON CONFLICT (id) DO UPDATE SET dggi_role = 'SIO';

      -- Assign to their group
      INSERT INTO public.dggi_user_group_assignments (
        id,
        user_id,
        group_name,
        workspace_id,
        created_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        v_group,
        v_workspace_id,
        now()
      )
      ON CONFLICT ON CONSTRAINT dggi_user_group_unique DO NOTHING;

      RAISE NOTICE 'Created: % (%) → %', v_name, v_email, v_group;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Done — 25 SIO users seeded across 5 groups.';
END $$;

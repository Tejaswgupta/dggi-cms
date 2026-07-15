-- Returns distinct batches (one representative row per batch) for paginating
-- the Provisional Attachment Register by 20 batches at a time.
--
-- p_workspace_id  : workspace filter
-- p_role          : caller's dggi_role
-- p_groups        : caller's group assignments (pass '{}' if none)
-- p_uid           : caller's user id
-- p_search        : ilike pattern applied to person_name, gstin_pan, entity_gstin,
--                   issue_involved, group_sio  (empty string = no filter)
-- p_date_from     : date_of_attachment >= (empty string = no filter)
-- p_date_to       : date_of_attachment <= (empty string = no filter)
-- p_sort_col      : column to order by (defaults to created_at)
-- p_sort_asc      : true = ASC, false = DESC
-- p_limit         : rows to return  (= PAGE_SIZE, typically 20)
-- p_offset        : row offset      (= (page-1) * PAGE_SIZE)

CREATE OR REPLACE FUNCTION public.dggi_provisional_attachment_batch_page(
  p_workspace_id text,
  p_role         text,
  p_groups       text[],
  p_uid          uuid,
  p_search       text,
  p_date_from    text,
  p_date_to      text,
  p_sort_col     text,
  p_sort_asc     boolean,
  p_limit        integer,
  p_offset       integer
)
RETURNS TABLE (
  batch_key            text,
  is_fallback          boolean,
  date_of_attachment   text,
  date_of_scn_issuance text,
  date_of_release      text,
  total_batches        bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_sort_col text := COALESCE(NULLIF(p_sort_col, ''), 'created_at');
BEGIN
  RETURN QUERY EXECUTE format(
    $sql$
    WITH filtered AS (
      SELECT
        id,
        COALESCE(NULLIF(attachment_batch_id, ''), id::text) AS batch_key,
        (attachment_batch_id IS NULL OR attachment_batch_id = '')  AS is_fallback,
        date_of_attachment::text,
        date_of_scn_issuance::text,
        date_of_release::text,
        %1$I                                                       AS _sort_val,
        created_at
      FROM dggi_provisional_attachment_records
      WHERE workspace_id = %2$L
        AND (
          %3$L IN ('ADG', 'DD_INT')
          OR (
            %3$L IN ('IO', 'SIO')
            AND sio = %4$L::uuid
          )
          OR (
            %3$L IN ('ADC', 'JD', 'DD', 'AD')
            AND "group" = ANY(%5$L::text[])
          )
          OR (
            %3$L NOT IN ('ADG','DD_INT','IO','SIO','ADC','JD','DD','AD')
            AND "group" = '__none__'
          )
        )
        AND (%6$L = '' OR (
              person_name   ILIKE '%%' || %6$L || '%%'
           OR gstin_pan     ILIKE '%%' || %6$L || '%%'
           OR entity_gstin  ILIKE '%%' || %6$L || '%%'
           OR issue_involved ILIKE '%%' || %6$L || '%%'
           OR group_sio     ILIKE '%%' || %6$L || '%%'
        ))
        AND (%7$L = '' OR date_of_attachment::text >= %7$L)
        AND (%8$L = '' OR date_of_attachment::text <= %8$L)
    ),
    first_per_batch AS (
      SELECT DISTINCT ON (batch_key)
        batch_key,
        is_fallback,
        date_of_attachment,
        date_of_scn_issuance,
        date_of_release,
        _sort_val,
        created_at
      FROM filtered
      ORDER BY batch_key, %9$s
    ),
    ordered AS (
      SELECT *,
             COUNT(*) OVER () AS total_batches,
             ROW_NUMBER() OVER (ORDER BY %9$s) AS rn
      FROM first_per_batch
    )
    SELECT
      batch_key,
      is_fallback,
      date_of_attachment,
      date_of_scn_issuance,
      date_of_release,
      total_batches
    FROM ordered
    WHERE rn > %10$s AND rn <= %10$s + %11$s
    ORDER BY rn
    $sql$,
    v_sort_col,                                 -- %1$I  sort column (identifier)
    p_workspace_id,                             -- %2$L
    p_role,                                     -- %3$L
    p_uid,                                      -- %4$L
    p_groups,                                   -- %5$L
    p_search,                                   -- %6$L
    p_date_from,                                -- %7$L
    p_date_to,                                  -- %8$L
    CASE WHEN p_sort_asc
         THEN format('%I ASC, created_at ASC', v_sort_col)
         ELSE format('%I DESC, created_at DESC', v_sort_col)
    END,                                        -- %9$s  (ORDER BY fragment)
    p_offset,                                   -- %10$s
    p_limit                                     -- %11$s
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dggi_provisional_attachment_batch_page(
  text,text,text[],uuid,text,text,text,text,boolean,integer,integer
) TO authenticated, service_role;

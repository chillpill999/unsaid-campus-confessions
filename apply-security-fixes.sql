REVOKE SELECT ON comments FROM anon, authenticated;

GRANT SELECT ON public_comments TO anon, authenticated;
GRANT SELECT ON public_confessions TO anon, authenticated;

DELETE FROM reactions a
USING reactions b
WHERE a.user_id = b.user_id
  AND a.confession_id = b.confession_id
  AND a.created_at < b.created_at;

ALTER TABLE reactions
  DROP CONSTRAINT IF EXISTS reactions_user_id_confession_id_reaction_type_key;
ALTER TABLE reactions
  ADD CONSTRAINT reactions_user_id_confession_id_key UNIQUE (user_id, confession_id);

CREATE OR REPLACE FUNCTION vote_poll(p_confession_id UUID, p_option_id TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll JSONB;
BEGIN
  SELECT poll_options INTO v_poll FROM confessions WHERE id = p_confession_id;

  IF v_poll IS NULL OR v_poll->'options' IS NULL THEN
    RAISE EXCEPTION 'POLL_NOT_FOUND';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_poll->'options') opt WHERE opt->>'id' = p_option_id
  ) THEN
    RAISE EXCEPTION 'INVALID_OPTION';
  END IF;

  IF v_poll->'voters' @> to_jsonb(ARRAY[p_user_id]) THEN
    RETURN v_poll;
  END IF;

  UPDATE confessions
  SET poll_options = jsonb_set(
        jsonb_set(
          jsonb_set(
            v_poll,
            '{total_votes}',
            to_jsonb(COALESCE((v_poll->>'total_votes')::int, 0) + 1)
          ),
          '{options}',
          (
            SELECT jsonb_agg(
              CASE WHEN opt->>'id' = p_option_id
                THEN jsonb_set(opt, '{votes}', to_jsonb(COALESCE((opt->>'votes')::int, 0) + 1))
                ELSE opt
              END
            )
            FROM jsonb_array_elements(v_poll->'options') opt
          )
        ),
        '{voters}',
        COALESCE(v_poll->'voters', '[]'::jsonb) || to_jsonb(p_user_id::text)
      ),
      updated_at = NOW()
  WHERE id = p_confession_id
    AND NOT (COALESCE(poll_options->'voters', '[]'::jsonb) @> to_jsonb(ARRAY[p_user_id]));

  IF NOT FOUND THEN
    RETURN v_poll;
  END IF;

  SELECT poll_options INTO v_poll FROM confessions WHERE id = p_confession_id;
  RETURN v_poll;
END;
$$;

REVOKE ALL ON FUNCTION vote_poll(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vote_poll(UUID, TEXT, UUID) TO authenticated;

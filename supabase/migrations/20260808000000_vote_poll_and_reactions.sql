-- Migration: vote_poll function + reactions constraint alignment
-- Date: 2026-08-08
--
-- Adds the atomic vote_poll RPC into the migrations chain so a fresh deploy of
-- supabase/migrations produces a feature-complete schema (previously the function
-- only existed in the ad-hoc root apply-security-fixes.sql) and aligns the
-- reactions table to enforce exactly ONE reaction per user per confession,
-- matching the toggle reaction behavior implemented in lib/actions/feed.ts.

-- 1. Create the vote_poll function (idempotent)
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

-- 2. Align the reactions unique constraint to one reaction per user per confession.
--    Remove the reaction_type dimension (which previously allowed a user to hold
--    multiple different reactions on the same confession, breaking toggleReaction's
--    .single() read). Deduplicate existing duplicate rows first.
DELETE FROM reactions a
USING reactions b
WHERE a.user_id = b.user_id
  AND a.confession_id = b.confession_id
  AND a.created_at < b.created_at;

ALTER TABLE reactions
  DROP CONSTRAINT IF EXISTS reactions_user_id_confession_id_reaction_type_key;
ALTER TABLE reactions
  DROP CONSTRAINT IF EXISTS reactions_user_id_confession_id_key;
ALTER TABLE reactions
  ADD CONSTRAINT reactions_user_id_confession_id_key UNIQUE (user_id, confession_id);

-- 3. Grant note: reactions table needs SELECT for the views used under
--    security_invoker. The anonymous view grants were handled in the base
--    migration; keep an explicit permission here for freshness.
GRANT SELECT ON reactions TO authenticated;
-- Migration: Security Hardening & View Isolation Fixes
-- Date: 2026-08-07

-- 1. Add snapshot_gender column to comments (used by the public_comments view)
--    Backfill from profiles so existing comments keep their author's gender.
ALTER TABLE comments ADD COLUMN IF NOT EXISTS snapshot_gender VARCHAR(50);

UPDATE comments cm
SET snapshot_gender = COALESCE(
  (SELECT p.gender FROM profiles p WHERE p.id = cm.author_id),
  cm.snapshot_gender
)
WHERE cm.snapshot_gender IS NULL;

-- 2. Recreate public_comments view
--    (DROP first: CREATE OR REPLACE VIEW cannot change an existing column's
--    type, and the gender column's height changes between the base schema's
--    varchar(50) and the fresh snapshot_gender expression.)
DROP VIEW IF EXISTS public_confessions;
DROP VIEW IF EXISTS public_comments;

CREATE VIEW public_comments AS
WITH ranked_authors AS (
  SELECT 
    confession_id,
    author_id,
    DENSE_RANK() OVER (PARTITION BY confession_id ORDER BY MIN(created_at) ASC) AS author_rank
  FROM comments
  WHERE is_deleted = false
  GROUP BY confession_id, author_id
)
SELECT 
  cm.id,
  cm.confession_id,
  cm.parent_comment_id,
  cm.content,
  'Anonymous ' || CHR(64 + ra.author_rank::int) AS anonymous_label,
  COALESCE(cm.snapshot_gender, 'Prefer not to say') AS gender,
  cm.created_at
FROM comments cm
JOIN ranked_authors ra ON cm.confession_id = ra.confession_id AND cm.author_id = ra.author_id
WHERE cm.is_deleted = false;

-- 2. Re-create public_confessions view using public_comments for comment_count
-- (Allows comment_count calculation under security_invoker = true without direct SELECT on comments table)
CREATE VIEW public_confessions AS
SELECT 
  c.id,
  c.public_code,
  c.content,
  cat.name AS category_name,
  cat.slug AS category_slug,
  cat.icon AS category_icon,
  c.image_path,
  c.recipient_gender,
  c.target_batch,
  c.target_department,
  c.snapshot_gender AS gender,
  c.poll_options,
  c.created_at,
  (SELECT COUNT(*)::int FROM public_comments cm WHERE cm.confession_id = c.id) AS comment_count,
  jsonb_build_object(
    'relatable', (SELECT COUNT(*)::int FROM reactions r WHERE r.confession_id = c.id AND r.reaction_type = 'relatable'),
    'funny', (SELECT COUNT(*)::int FROM reactions r WHERE r.confession_id = c.id AND r.reaction_type = 'funny'),
    'support', (SELECT COUNT(*)::int FROM reactions r WHERE r.confession_id = c.id AND r.reaction_type = 'support'),
    'interesting', (SELECT COUNT(*)::int FROM reactions r WHERE r.confession_id = c.id AND r.reaction_type = 'interesting')
  ) AS reaction_counts
FROM confessions c
LEFT JOIN categories cat ON c.category_id = cat.id
WHERE c.moderation_status = 'approved' AND c.is_deleted = false;

-- 3. Views run with OWNER privileges (security_invoker = false) so the safe
--    public views stay readable by anon/authenticated despite the REVOKEd
--    table-level SELECT on confessions/comments. Flipping security_invoker = true
--    hides the feed because callers lack table-level SELECT — do NOT enable it
--    without adding matching column-scoped GRANTs.
ALTER VIEW public_confessions SET (security_invoker = false);
ALTER VIEW public_comments   SET (security_invoker = false);

-- 4. Revoke direct SELECT on raw comments table from public/authenticated users
REVOKE SELECT ON comments FROM anon, authenticated;

-- 5. Grant SELECT on public_comments and public_confessions views
GRANT SELECT ON public_comments TO anon, authenticated;
GRANT SELECT ON public_confessions TO anon, authenticated;

-- 6. Enable RLS and permissions on anonymous_conversations and anonymous_messages if present
ALTER TABLE IF EXISTS anonymous_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS anonymous_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'anonymous_conversations') THEN
    EXECUTE 'GRANT ALL ON anonymous_conversations TO authenticated';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'anonymous_messages') THEN
    EXECUTE 'GRANT ALL ON anonymous_messages TO authenticated';
  END IF;
END $$;

-- 7. Friend Requests & Direct Messages Tables
CREATE TABLE IF NOT EXISTS friend_requests (
  id TEXT PRIMARY KEY,
  sender_username VARCHAR(100) NOT NULL,
  sender_name VARCHAR(100),
  receiver_username VARCHAR(100) NOT NULL,
  receiver_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id TEXT PRIMARY KEY,
  conversation_key VARCHAR(255) NOT NULL,
  sender_username VARCHAR(100) NOT NULL,
  receiver_username VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dm_conv_key ON direct_messages (conversation_key);
CREATE INDEX IF NOT EXISTS idx_fr_receiver ON friend_requests (receiver_username, status);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

GRANT ALL ON friend_requests TO authenticated, service_role;
GRANT ALL ON direct_messages TO authenticated, service_role;


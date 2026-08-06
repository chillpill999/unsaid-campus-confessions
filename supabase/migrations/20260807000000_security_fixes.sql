-- Migration: Security Hardening & View Isolation Fixes
-- Date: 2026-08-07

-- 1. Ensure security_invoker is enabled on public views
ALTER VIEW public_confessions SET (security_invoker = true);
ALTER VIEW public_comments SET (security_invoker = true);

-- 2. Revoke direct SELECT on raw comments table from public/authenticated users
-- (Clients must query public_comments view to get thread-scoped labels without author_id)
REVOKE SELECT ON comments FROM anon, authenticated;

-- 3. Grant SELECT on public_comments and public_confessions views
GRANT SELECT ON public_comments TO anon, authenticated;
GRANT SELECT ON public_confessions TO anon, authenticated;

-- 4. Enable RLS and permissions on anonymous_conversations and anonymous_messages if present
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

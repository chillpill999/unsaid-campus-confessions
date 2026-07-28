-- PostgreSQL Schema for Unsaid (Campus Confessions)
-- Migration File: 20260727000000_init_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Colleges Table
CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    email_domain VARCHAR(255) NOT NULL UNIQUE,
    location VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    gender VARCHAR(50) NOT NULL CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say')),
    college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
    batch VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'moderator', 'admin')),
    account_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'restricted', 'suspended', 'banned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Confessions Table
CREATE TABLE IF NOT EXISTS confessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    public_code VARCHAR(20) NOT NULL UNIQUE,
    content TEXT NOT NULL CHECK (char_length(content) <= 1000),
    category_id UUID NOT NULL REFERENCES categories(id),
    image_path TEXT,
    recipient_gender VARCHAR(50),
    target_batch VARCHAR(50),
    target_department VARCHAR(100),
    moderation_status VARCHAR(50) DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
    poll_options JSONB DEFAULT NULL,
    snapshot_gender VARCHAR(50) NOT NULL,
    snapshot_batch VARCHAR(50) NOT NULL,
    snapshot_department VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confession_id UUID NOT NULL REFERENCES confessions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reactions Table
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    confession_id UUID NOT NULL REFERENCES confessions(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL CHECK (reaction_type IN ('relatable', 'funny', 'support', 'interesting')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, confession_id, reaction_type)
);

-- 7. Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    confession_id UUID NOT NULL REFERENCES confessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, confession_id)
);

-- 8. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    confession_id UUID REFERENCES confessions(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'actioned', 'dismissed')),
    assigned_moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    confession_id UUID REFERENCES confessions(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Blocks Table
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_user_id)
);

-- 11. Mood Votes Table
CREATE TABLE IF NOT EXISTS mood_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    mood VARCHAR(50) NOT NULL CHECK (mood IN ('chaos', 'exhausted', 'trauma', 'romantic', 'motivated', 'surviving')),
    vote_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, vote_date)
);

-- 12. Anonymous Conversations Table
CREATE TABLE IF NOT EXISTS anonymous_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confession_id UUID NOT NULL REFERENCES confessions(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'blocked', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Anonymous Messages Table
CREATE TABLE IF NOT EXISTS anonymous_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES anonymous_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Moderation Actions Table
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    confession_id UUID REFERENCES confessions(id) ON DELETE SET NULL,
    comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('warn', 'restrict', 'suspend', 'ban', 'restore')),
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Identity Access Logs Table (APPEND ONLY)
CREATE TABLE IF NOT EXISTS identity_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    confession_id UUID REFERENCES confessions(id) ON DELETE SET NULL,
    comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
    reason VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_public_code ON confessions(public_code);
CREATE INDEX IF NOT EXISTS idx_comments_confession_id ON comments(confession_id);
CREATE INDEX IF NOT EXISTS idx_reactions_confession_id ON reactions(confession_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- SAFE PUBLIC VIEWS (WITHOUT AUTHOR_ID OR IDENTITY METADATA)

-- Safe Public Confessions View
CREATE OR REPLACE VIEW public_confessions AS
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
  (SELECT COUNT(*)::int FROM comments cm WHERE cm.confession_id = c.id AND cm.is_deleted = false) AS comment_count,
  jsonb_build_object(
    'relatable', (SELECT COUNT(*)::int FROM reactions r WHERE r.confession_id = c.id AND r.reaction_type = 'relatable'),
    'funny', (SELECT COUNT(*)::int FROM reactions r WHERE r.confession_id = c.id AND r.reaction_type = 'funny'),
    'support', (SELECT COUNT(*)::int FROM reactions r WHERE r.confession_id = c.id AND r.reaction_type = 'support'),
    'interesting', (SELECT COUNT(*)::int FROM reactions r WHERE r.confession_id = c.id AND r.reaction_type = 'interesting')
  ) AS reaction_counts
FROM confessions c
LEFT JOIN categories cat ON c.category_id = cat.id
WHERE c.moderation_status = 'approved' AND c.is_deleted = false;

-- Safe Public Comments View (Thread-Scoped Anonymous Labels)
CREATE OR REPLACE VIEW public_comments AS
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
  p.gender,
  cm.created_at
FROM comments cm
JOIN ranked_authors ra ON cm.confession_id = ra.confession_id AND cm.author_id = ra.author_id
LEFT JOIN profiles p ON cm.author_id = p.id
WHERE cm.is_deleted = false;

-- ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_access_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read, insert, and update their own profile.
CREATE POLICY "Read Own Profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Insert Own Profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Update Own Profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Confessions: Public read access for approved, non-deleted confessions; insert/update restricted to author
CREATE POLICY "Public Read Approved Confessions" ON confessions FOR SELECT USING (moderation_status = 'approved' AND is_deleted = false);
CREATE POLICY "Insert Own Confession" ON confessions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update Own Confession" ON confessions FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admin Select Confessions" ON confessions FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Revoke direct table SELECT from all roles to enforce view-only access
REVOKE SELECT ON confessions FROM anon, authenticated;

-- Grant SELECT access on public views to anon and authenticated roles
GRANT SELECT ON public_confessions TO anon, authenticated;
GRANT SELECT ON public_comments TO anon, authenticated;
GRANT SELECT ON categories TO anon, authenticated;
GRANT SELECT ON colleges TO anon, authenticated;

-- Grant write permissions on user-writable tables to authenticated role
-- (RLS policies enforce row-level restrictions, but table-level GRANT is required first)
GRANT INSERT, UPDATE ON confessions TO authenticated;
GRANT INSERT, UPDATE ON comments TO authenticated;
GRANT INSERT, DELETE ON reactions TO authenticated;
GRANT INSERT, DELETE ON bookmarks TO authenticated;
GRANT INSERT ON reports TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT INSERT, DELETE ON blocks TO authenticated;
GRANT ALL ON mood_votes TO authenticated;
GRANT INSERT, SELECT ON anonymous_conversations TO authenticated;
GRANT INSERT, SELECT ON anonymous_messages TO authenticated;

-- Bookmarks & Reactions: User restricted
CREATE POLICY "Manage Own Bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage Own Reactions" ON reactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage Own Notifications" ON notifications FOR ALL USING (auth.uid() = recipient_id);

-- Reports: Student creates report
CREATE POLICY "Insert Report" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admin Select Reports" ON reports FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'moderator'))
);

CREATE POLICY "Admin Update Reports" ON reports FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'moderator'))
);

CREATE POLICY "Select Comments" ON comments FOR SELECT USING (true);

CREATE POLICY "Insert Own Comment" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admin Select Identity Logs" ON identity_access_logs FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Manage Own Blocks" ON blocks FOR ALL USING (auth.uid() = blocker_id);

CREATE POLICY "Manage Own Mood Vote" ON mood_votes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Select Own Conversations" ON anonymous_conversations FOR SELECT USING (
  auth.uid() IN (creator_id, participant_id)
);

CREATE POLICY "Insert Conversation" ON anonymous_conversations FOR INSERT WITH CHECK (
  auth.uid() = creator_id
);

CREATE POLICY "Select Own Messages" ON anonymous_messages FOR SELECT USING (
  auth.uid() IN (
    SELECT creator_id FROM anonymous_conversations WHERE id = conversation_id
    UNION
    SELECT participant_id FROM anonymous_conversations WHERE id = conversation_id
  )
);

CREATE POLICY "Insert Own Message" ON anonymous_messages FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT creator_id FROM anonymous_conversations WHERE id = conversation_id
    UNION
    SELECT participant_id FROM anonymous_conversations WHERE id = conversation_id
  )
);

CREATE POLICY "Admin Select Moderation Actions" ON moderation_actions FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'moderator'))
);

-- Performance Indexes for Historical Scale & Cursor Pagination
CREATE INDEX IF NOT EXISTS idx_confessions_created_at_id ON confessions(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_public_code ON confessions(public_code);
CREATE INDEX IF NOT EXISTS idx_confessions_moderation_is_deleted ON confessions(moderation_status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_comments_confession_created ON comments(confession_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_reactions_confession_type ON reactions(confession_id, reaction_type);


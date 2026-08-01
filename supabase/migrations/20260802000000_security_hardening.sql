-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY HARDENING MIGRATION (apply to the live Supabase project's SQL editor)
-- Date: 2026-08-02
--
-- 1. Close the RLS privilege-escalation hole: users could UPDATE their own
--    profiles row (policy "Update Own Profile" is keyed only on auth.uid() = id)
--    and set role = 'admin' / account_status = 'active' to self-escalate or
--    un-ban themselves. Column-level security now forbids changing those fields
--    with a client (anon/authenticated) key. Only the service-role admin path
--    may change them.
--
-- 2. Create the friend_requests / friends tables (used by the app but previously
--    created ad-hoc with no RLS) WITH RLS ENABLED and NO client grants, so all
--    access flows through the service-role server actions only.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Column-level security on profiles: block role / account_status mutation
--    for client-issued requests. The service role (used by admin server actions)
--    bypasses RLS and is unaffected.
REVOKE UPDATE (role, account_status) ON profiles FROM anon, authenticated;

-- Also harden the remaining profile write surfaces: keep users able to edit
-- benign profile fields, but never their role or status columns.
COMMENT ON COLUMN profiles.role IS
  'Role is managed server-side only. Clients cannot UPDATE this column.';

COMMENT ON COLUMN profiles.account_status IS
  'Account status (bans/suspensions) is managed by admins only. Clients cannot UPDATE this column.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Friend tables with RLS enabled and no anon/authenticated grants.
--    The server-side actions (service role) remain the only access path.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS friend_requests (
    id TEXT PRIMARY KEY,
    sender_username TEXT NOT NULL,
    sender_name TEXT,
    receiver_username TEXT NOT NULL,
    receiver_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- No GRANT to anon/authenticated: only the service role (bypasses RLS) can touch
-- these. Any direct client query will be denied.

CREATE TABLE IF NOT EXISTS friends (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    friend_username TEXT NOT NULL,
    full_name TEXT,
    department TEXT,
    batch TEXT,
    avatar_gradient TEXT,
    status TEXT NOT NULL DEFAULT 'accepted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- No client grants by design (see friend_requests).

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Sanity guard: explicitly deny direct table writes that the app only ever
--    performs through the service role, so a future client-side regression
--    cannot bypass the server's authorization checks.
--    (identity_access_logs is already RLS-protected for admin SELECT; remain
--    append-only via service role.)
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE INSERT, UPDATE, DELETE ON identity_access_logs FROM anon, authenticated;

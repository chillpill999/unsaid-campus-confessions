-- ─────────────────────────────────────────────────────────────────────────────
-- USERNAME SYNC MIGRATION
-- Date: 2026-08-04
--
-- Adds a `username` column to the profiles table so usernames are stored in
-- the database and synced across all devices, instead of being generated
-- randomly per-device in localStorage.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Add username column (nullable for existing rows, unique when set)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2) Create a unique index so no two users can claim the same handle
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
  ON profiles (username)
  WHERE username IS NOT NULL;

-- 3) Backfill existing profiles with their email prefix as default username
UPDATE profiles
SET username = LOWER(SPLIT_PART(
  (SELECT email FROM auth.users WHERE auth.users.id = profiles.id),
  '@', 1
))
WHERE username IS NULL;

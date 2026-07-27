# Unsaid — Anonymous College Confession Platform

**Unsaid** is a production-quality, full-stack anonymous campus confession platform. Students authenticate using Google through **Supabase Auth**, but interact publicly under anonymous identities while maintaining admin accountability and strict privacy boundaries.

---

## 🔒 Fundamental Anonymity Model

**Google verifies who the student is → Supabase securely stores the authenticated account → other students see only anonymous identity + gender → authorized admins can reveal the real authenticated identity for moderation.**

### Anonymity Disclosures
- **Public Anonymity**: Students see only `Anonymous • Gender` (e.g., `Anonymous • Male`). Real names, emails, Google profile pictures, and Supabase `auth.users` UUIDs are **never** exposed to student-facing client components or APIs.
- **Thread-Scoped Comment Labels**: Comments feature dynamic labels (`Anonymous A`, `Anonymous B`) calculated per confession thread. Users receive distinct labels across different threads to prevent cross-post correlation.
- **Admin Accountability**: Authorized administrators can perform audited identity reveals strictly when required for safety, harassment, or severe abuse investigations. Every reveal creates an append-only record in `identity_access_logs`.

---

## 🚀 Deployment Checklist

Before launching in production, complete this checklist:

- [ ] Create a production **Supabase Project**.
- [ ] Execute database migrations in sequence (`supabase/migrations/20260727000000_init_schema.sql`).
- [ ] Configure Supabase Storage bucket `confession-images` with public read access and 5MB upload limit.
- [ ] Configure **Google OAuth** in Supabase Auth Dashboard.
- [ ] Bootstrap the first Administrator via Supabase SQL Console (see procedure below).
- [ ] Set production environment variables (`DEMO_MODE=false`).
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to server environment variables.
- [ ] Deploy Next.js application to Vercel or Node.js server with HTTPS.
- [ ] Run post-deployment smoke tests.

---

## ⚙️ Environment Variables

Create `.env.local` for local development or set variables in your hosting environment (e.g. Vercel):

```env
# Public Supabase credentials (Client & Server)
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-only secrets (NEVER prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Application Settings
NEXT_PUBLIC_APP_URL=https://yourcampusdomain.com
DEMO_MODE=false
```

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` must **never** be prefixed with `NEXT_PUBLIC_` or imported into client-side components.

---

## 📦 Supabase Setup & Migration Order

1. **Execute Initial Migration**:
   Run `supabase/migrations/20260727000000_init_schema.sql` in the Supabase SQL Editor. This initializes:
   - Tables: `colleges`, `profiles`, `categories`, `confessions`, `comments`, `reactions`, `bookmarks`, `reports`, `notifications`, `blocks`, `mood_votes`, `anonymous_conversations`, `identity_access_logs`.
   - Safe Public Views: `public_confessions` and `public_comments` (which strip `author_id` and auth metadata).
   - RLS Policies on all 15 tables.

2. **Execute Initial Categories Seed**:
   Run `supabase/seed.sql` to populate initial campus categories (Confession, Crush, Funny, Hostel, Appreciation, Question, Campus Life).

3. **Storage Bucket Configuration**:
   In Supabase Dashboard → Storage → Create Bucket:
   - Bucket Name: `confession-images`
   - Public Bucket: Enabled (Read-only)
   - Allowed MIME types: `image/png, image/jpeg, image/webp`
   - Max file size: `5MB`

---

## 🔑 Google OAuth Production Setup

1. Go to **Google Cloud Console** → APIs & Services → Credentials.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Set **Authorized JavaScript Origins**:
   - `https://your-supabase-project.supabase.co`
   - `https://yourcampusdomain.com`
4. Set **Authorized Redirect URIs**:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret**.
6. Go to **Supabase Dashboard** → Authentication → Providers → Google:
   - Enable Google Provider.
   - Paste Client ID & Client Secret.
   - Save configuration.

---

## 🔐 Secure Admin Bootstrap Procedure

**Do NOT create a public endpoint or bypass query parameter (e.g. `makeMeAdmin=true`)!**

To assign the first Administrator safely:

1. Have the administrator log in to the application once via Google OAuth to create their `auth.users` account and `profiles` row.
2. Open the **Supabase Dashboard** → SQL Editor.
3. Execute the following SQL query replacing the email address:

```sql
-- Secure Administrator Role Assignment
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'admin.email@yourcampus.edu'
);
```

4. Verify role assignment:
```sql
SELECT id, role, created_at FROM profiles WHERE role = 'admin';
```

---

## 🧪 Post-Deployment Smoke Tests

After deploying to production:

1. **Unauthenticated Check**:
   - Open `https://yourcampusdomain.com/` → verify Landing Page renders cleanly.
   - Verify unauthenticated users cannot access protected feeds before logging in.
2. **Google Authentication & Onboarding**:
   - Click "Continue with Google" → complete OAuth flow → set gender presentation and college in `/onboarding`.
3. **Confession Creation & Anonymity Check**:
   - Publish a confession with public code (e.g. `#CF7K2P`).
   - Open browser developer tools → inspect DOM & Network XHR response → verify **zero** `author_id`, `email`, or `auth.users` UUID fields exist.
4. **Thread Comments & Label Check**:
   - Comment on a confession → verify label appears as `Anonymous A`.
5. **Admin Identity Reveal & Audit Check**:
   - Log in as the assigned Admin → navigate to `/admin/confessions`.
   - Click "Reveal Author Identity" → enter justification ("Safety investigation") → verify identity payload renders and an entry is appended to `/admin/identity-access`.
6. **Automated Test Verification**:
   - Run local security suite: `npm run test:security` (25/25 passed).

---

## 🛠️ Local Development & Security Testing

```bash
# Install dependencies
npm install

# Run automated security test suite
npm run test:security

# Run local development server
npm run dev

# Run production build check
npm run build
```

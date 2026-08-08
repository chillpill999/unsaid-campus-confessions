# 🔒 ConfessionLnjpit — Anonymous Campus Platform

<div align="center">

![ConfessionLnjpit Banner](https://www.confessionlnjpit.in/og-image.png)

### The Official 100% Anonymous Campus Platform for Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra, Bihar)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-confessionlnjpit.in-FF6B00?style=for-the-badge&logo=google-chrome&logoColor=white)](https://www.confessionlnjpit.in)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Production-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 🌟 Overview

**ConfessionLnjpit** (`unsaid-campus-confessions`) is a production-grade, full-stack anonymous student community web application built for **Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra, Bihar)**.

Students authenticate securely via **Google OAuth**, but all public interactions—confessions, comments, crush signals, and campus polls—are stripped of user metadata at the database level. It combines **zero-leakage student anonymity** with **real-time WebSocket updates**, **multi-device account synchronization**, and **audited administrative moderation**.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| 🔒 **100% Database Anonymity** | PostgreSQL views (`public_confessions`, `public_comments`) strip `author_id` and auth metadata before sending data to the client. zero identity leakage. |
| ⚡ **Realtime WebSocket Feed** | Live broadcast events for instant reaction count updates, comment counts, poll progress, and campus posts across all connected devices. |
| 💌 **Anonymous Signal & DMs** | "Send Signal" button on crush confessions opens private anonymous messaging threads without revealing either student's identity. |
| 🪪 **Multi-Device Unified Identity** | Automatic cross-device handle synchronization via Supabase `profiles` table. Log in on phone, laptop, or tablet and maintain the exact same `@handle`. |
| 📊 **Hot Campus Polls** | Create & vote on interactive polls with dynamic CSS gradient progress bars and instant vote persistence. |
| 🛡️ **Audited Admin Moderation** | Authorized administrators can investigate severe abuse or safety reports with append-only audit logging (`identity_access_logs`). |
| 🔍 **Search & AEO Engine** | High-rank SEO & AEO (AI Engine Optimization) setup featuring dynamic Next.js `generateMetadata()`, Schema.org JSON-LD microdata, `sitemap.xml`, `robots.txt`, and `llms.txt`. |

---

## 🛠️ Technology Stack

```
                               ┌────────────────────────────────────────┐
                               │           NEXT.JS 14 FRONTEND          │
                               │  App Router • TailwindCSS • React 18   │
                               └──────────────────┬─────────────────────┘
                                                  │
                                   ┌──────────────┴──────────────┐
                                   ▼                             ▼
                        ┌────────────────────┐        ┌────────────────────┐
                        │   SUPABASE AUTH    │        │ SUPABASE REALTIME  │
                        │    Google OAuth    │        │ WebSocket Channels │
                        └──────────┬─────────┘        └──────────┬─────────┘
                                   │                             │
                                   └──────────────┬──────────────┘
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │          SUPABASE POSTGRESQL           │
                               │ Row Level Security • Security Invoker  │
                               └────────────────────────────────────────┘
```

- **Framework**: Next.js 14.2 (App Router, Server Actions, Server Components)
- **Database & Backend**: Supabase (PostgreSQL 15, Realtime WebSockets, Row Level Security)
- **Authentication**: Supabase Auth with Google OAuth 2.0
- **Styling & Icons**: Vanilla CSS / TailwindCSS, Lucide Icons, Google Fonts (Inter & Outfit)
- **Deployment**: Vercel Cloud Platform (CI/CD)

---

## 🔒 Security & Anonymity Architecture

1. **Public Anonymity Guarantee**:
   Students see only `Anonymous • Gender` (e.g. `Anonymous • Male`). Real names, emails, Google profile pictures, and Supabase `auth.users` UUIDs are **never** rendered on client components.
2. **Thread-Scoped Comment Labels**:
   Comments feature dynamic labels (`Anonymous A`, `Anonymous B`) calculated per confession thread. Users receive distinct labels across different threads to prevent cross-post correlation.
3. **Safe Read-Only Views**:
   Public feeds execute via the `public_confessions` and `public_comments` views, which expose only whitelisted columns and never leak `author_id`. Direct SELECT on the raw `confessions` and `comments` tables is revoked from `anon`/`authenticated`, so the views are the only client read path.
4. **Append-Only Identity Reveal Logs**:
   Admin identity reveals require an explicit safety justification and generate immutable audit logs in `identity_access_logs`.

---

## 📦 Database Schema Overview

```sql
-- Main Database Tables:
-- 1. profiles: User profile metadata & unique campus handle
-- 2. confessions: Raw confession posts (protected by RLS)
-- 3. public_confessions: Safe view stripping author_id
-- 4. comments: Thread comments (protected by RLS)
-- 5. public_comments: Safe view with thread-scoped labels (Anonymous A, B, C)
-- 6. reactions: Post reactions (relatable, funny, support, interesting)
-- 7. bookmarks: Saved confessions
-- 8. reports: Moderation flags
-- 9. identity_access_logs: Immutable admin audit trail
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- Node.js 18.x or 20.x
- npm / pnpm / yarn
- A free Supabase Project

### 1. Clone Repository
```bash
git clone https://github.com/chillpill999/unsaid-campus-confessions.git
cd unsaid-campus-confessions
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
# Public Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-Only Service Role Key (NEVER prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://www.confessionlnjpit.in
DEMO_MODE=false
```

### 4. Setup Database Schema
Execute the SQL migrations in your Supabase SQL Editor in order:
1. `supabase/migrations/20260727000000_init_schema.sql` (Tables & RLS)
2. `supabase/migrations/20260802000000_security_hardening.sql` (Security Rules)
3. `supabase/migrations/20260804000000_username_sync.sql` (Multi-Device Username Sync)

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗝️ Admin Bootstrap Procedure

To assign the first Administrator role safely:

1. Log in once via Google OAuth to create your account in `auth.users`.
2. Open **Supabase Dashboard** → **SQL Editor**.
3. Run the following query with your email:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'your.email@gmail.com'
);
```

---

## 🌐 Live Production Deployment

This application is deployed on **Vercel** with custom domain routing:

- **Primary Domain**: [https://www.confessionlnjpit.in](https://www.confessionlnjpit.in)
- **Vercel Project**: `yoshi-11/unsaid-campus-confessions`

---

## 📜 License & Credits

Designed & Developed with ❤️ for **Loknayak Jai Prakash Institute of Technology (LNJPIT Chapra, Bihar)**.

Licensed under the [MIT License](LICENSE).

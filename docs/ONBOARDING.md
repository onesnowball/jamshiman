# Developer Onboarding — jamshiman

This guide lets a collaborator run the full stack locally, make changes safely, and push to a side clone before touching jamshiman.com.

---

## Prerequisites

- Node.js 18+ (`node -v`)
- Git
- A GitHub account with access to the repo
- A free Supabase account (supabase.com) — they'll create their own project

---

## Step 1 — Fork the repo for a side clone

The workflow is: **their own Supabase project + their own Vercel deployment + PRs into main**.

```bash
# Clone the repo (or their fork of it)
git clone https://github.com/onesnowball/jamshiman.git
cd jamshiman

# Install dependencies
npm install
```

---

## Step 2 — Create their own Supabase project

1. Go to supabase.com → New project
2. Note the **Project URL** and **anon key** (under Settings → API)
3. Note the **service role key** (same page — keep this secret)

### Run migrations in order

In the Supabase dashboard → SQL Editor, run each file in `supabase/migrations/` in numbered order:

```
001_initial_schema.sql
001b_continue_schema.sql
002_course_discussions.sql
003_seed_departments_courses.sql
004_upvotes.sql
005_board_categories.sql
006_messages.sql
007_me_faculty.sql
008_northwestern.sql
009_status_enum_values.sql
010_uiuc.sql
011_rename_uiuc.sql
012_advisor_review_lab_member.sql
013_suspension_workflow.sql
014_user_handles.sql
```

Each file is additive — just paste and run. If a later migration fails, check that earlier ones ran successfully first.

### Disable Row-Level Security (RLS)

The app uses service-role key for all mutations (application-level auth, not RLS). In Supabase → Table Editor, make sure RLS is disabled on all tables, or run:

```sql
-- Disable RLS on all tables (safe for this architecture)
alter table universities disable row level security;
alter table users disable row level security;
alter table departments disable row level security;
alter table posts disable row level security;
alter table comments disable row level security;
alter table advisors disable row level security;
alter table advisor_reviews disable row level security;
alter table courses disable row level security;
alter table course_reviews disable row level security;
alter table flags disable row level security;
alter table messages disable row level security;
alter table upvotes disable row level security;
alter table campus_admins disable row level security;
alter table suspension_requests disable row level security;
alter table suspension_appeals disable row level security;
alter table audit_log disable row level security;
```

### Configure Supabase Auth email template

In Supabase → Authentication → Email Templates → Magic Link:
- Change the template to show just the OTP code (no clickable link)
- Subject: `Your jamshiman sign-in code`

---

## Step 3 — Set up environment variables

Create `.env.local` in the project root (never commit this file):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Comma-separated list of allowed .edu domains
NEXT_PUBLIC_ALLOWED_SCHOOL_DOMAINS=umich.edu,northwestern.edu,illinois.edu
ALLOWED_SCHOOL_DOMAINS=umich.edu,northwestern.edu,illinois.edu
```

---

## Step 4 — Run locally

```bash
npm run dev
# → http://localhost:3000
```

To log in locally without a real .edu email, there's a dev bypass cookie. Check `lib/dev-bypass.ts` for the mechanism — you can set `dev_bypass_email=test@umich.edu` as a cookie in browser devtools to simulate a UMich student session.

---

## Step 5 — Seed some data

After logging in as a dev user, go to `/admin` to:
1. Add departments (academic + board categories)
2. Add a few courses
3. Add a few advisors

Or insert directly via Supabase's Table Editor.

To make a user a global admin, run in the SQL editor:
```sql
update users set role = 'admin' where email_hash = 'YOUR_EMAIL_HASH';
```

The email hash is SHA-256 of the lowercase email. Or just find your user in the `users` table by `created_at` and update the `role` column directly.

---

## Step 6 — Make changes

### Safe zones — own these files freely:
- `app/[school]/` — any school-scoped pages
- `app/api/` routes (within their feature area)
- `components/` (except `Navbar.tsx`, `NavbarClient.tsx`)
- New migrations (use the next number in sequence)

### Coordinate before touching:
- `types/database.ts` — everyone imports this; changes need to be communicated
- `lib/server-auth.ts` — auth patterns that everything depends on
- `globals.css` — shared design tokens
- `middleware.ts` — affects every request

### Migrations
- Always create a new numbered file; never edit an existing migration
- Make columns nullable or give defaults — never break existing rows
- Test the migration on your own Supabase project before it goes into main

---

## Step 7 — Deploy a side clone on Vercel

1. Go to vercel.com → New Project → Import their fork
2. Set the same environment variables (but pointing to their Supabase project)
3. Their side clone lives at `their-project.vercel.app`
4. They can share this URL for review before merging

---

## Step 8 — Submit a pull request

```bash
# Create a feature branch (never commit directly to main)
git checkout -b feature/my-feature-name

# Make changes, then:
git add specific/files/you/changed.tsx
git commit -m "Brief description of what and why"
git push origin feature/my-feature-name
```

Then open a PR on GitHub. The PR deploys a preview on Vercel automatically.

**PR checklist before merging to main:**
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] Any new DB columns have a migration file with the next number
- [ ] The side-clone Vercel preview looks correct
- [ ] No `.env` or secret keys committed
- [ ] `types/database.ts` updated if schema changed

---

## What happens when it merges

Merging to `main` → Vercel auto-deploys to jamshiman.com within ~90 seconds. If a migration is part of the change, that needs to be run manually in the production Supabase SQL editor at the same time.

---

## Key files to understand first

| File | Why it matters |
|---|---|
| `lib/server-auth.ts` | Every page and API uses this to get the current user |
| `lib/admin-context.ts` | How admins know which university they're managing |
| `types/database.ts` | TypeScript types for every table — change schema here too |
| `middleware.ts` | Sets `last_school` cookie; controls auth redirect |
| `app/globals.css` | All shared CSS classes — use these, don't invent new ones |
| `components/Navbar.tsx` | Rendered on every page; changes here affect everything |

# jamshiman

An Everytime-inspired UMich launch for honest campus information: advisor reviews, course reviews, department boards, and a private schedule builder.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (Postgres + Auth + RLS)
- **Tailwind CSS** + DM Sans font
- **Vercel** for hosting

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd gradpeer
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL editor, run the full migration: `supabase/migrations/001_initial_schema.sql`
3. In Authentication settings:
   - Enable Email magic links
   - Set Site URL to `http://localhost:3000`
   - Add `http://localhost:3000/auth/callback` to Redirect URLs
4. For production, configure a custom SMTP sender in Supabase Auth.
   - Recommended: [Resend](https://resend.com)
   - Sender example: `login@jamshiman.com`
   - Production Site URL: `https://jamshiman.com`
   - Production Redirect URL: `https://jamshiman.com/auth/callback`

### 3. Set environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (keep secret!)
- `ALLOWED_SCHOOL_DOMAINS` — comma-separated launch allowlist, e.g. `umich.edu`
- `NEXT_PUBLIC_ALLOWED_SCHOOL_DOMAINS` — same value for client-side validation
- `ADMIN_EMAILS` — comma-separated admin emails that should get admin access automatically on login

### 4. Seed launch data

Seed at least:
- advisors for your first department(s)
- a starter course catalog

Example advisor seed:

In Supabase SQL editor:

```sql
-- Find the MechE dept id first
select id from departments where slug = 'meche';

-- Then insert advisors (replace dept_id with actual value)
insert into advisors (university_id, dept_id, name, title, lab_name, research_areas)
select
  u.id,
  d.id,
  'Prof. Jane Smith',
  'Associate Professor',
  'Thermal Systems Lab',
  array['Heat transfer', 'HVAC', 'Energy systems']
from universities u, departments d
where u.domain = 'umich.edu' and d.slug = 'meche';
```

Example course seed:

```sql
insert into courses (university_id, dept_id, code, name, credits)
select
  u.id,
  d.id,
  'MECHENG 501',
  'Advanced Thermodynamics',
  3
from universities u, departments d
where u.domain = 'umich.edu' and d.slug = 'meche';
```

### 5. Make yourself admin

Recommended:

1. Add your email to `ADMIN_EMAILS` in `.env.local`
2. Sign in with that email
3. The auth callback will create/update your `users` row with `role = 'admin'`

Manual fallback:

```sql
update users set role = 'admin'
where email_hash = encode(digest('your@umich.edu', 'sha256'), 'hex');
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project structure

```
app/
  page.tsx              — Landing page
  auth/
    login/page.tsx      — Magic link login
    callback/route.ts   — Auth callback, creates user profile
  advisors/
    page.tsx            — Advisor listing + search
    [id]/page.tsx       — Individual advisor + reviews
  courses/
    page.tsx            — Course search + listing
    [id]/page.tsx       — Individual course + reviews
  boards/
    page.tsx            — Department board directory
    [dept]/page.tsx     — Department thread list
    [dept]/[postId]/page.tsx — Thread + comments
  schedule/
    page.tsx            — Private schedule builder
  profile/
    page.tsx            — Private user profile
  admin/
    page.tsx            — Admin dashboard
    flags/page.tsx      — Flagged content queue
    advisors/page.tsx   — Advisor management
    access/page.tsx     — Admin role management
  api/
    advisors/route.ts   — Advisor search API
    reviews/route.ts    — Submit review API
    course-reviews/route.ts
    posts/route.ts
    comments/route.ts
    flags/route.ts
    schedules/route.ts
    schedule-courses/route.ts
    admin/
      advisors/route.ts
      access/route.ts
      flags/route.ts

components/
  Navbar.tsx
  ui/StarRating.tsx
  forms/AdvisorReviewForm.tsx

lib/
  supabase/client.ts    — Browser client
  supabase/server.ts    — Server + admin clients

types/
  database.ts           — Full TypeScript types

supabase/
  migrations/
    001_initial_schema.sql  — Full DB schema
```

---

## Current launch scope
- UMich-only magic-link auth
- Advisor reviews with a 3-review privacy gate
- Course reviews with the same 3-review gate
- Department boards with anonymous posting, comments, and reporting
- Private schedule builder with manual course meeting blocks
- Admin dashboard for advisors, access, and moderation flags

## Deploy to Vercel

1. Import the repo into Vercel.
2. Add all env vars in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL=https://jamshiman.com`
   - `ALLOWED_SCHOOL_DOMAINS=umich.edu`
   - `NEXT_PUBLIC_ALLOWED_SCHOOL_DOMAINS=umich.edu`
   - `ADMIN_EMAILS=founder1@umich.edu,founder2@umich.edu`
   - `NEXT_PUBLIC_DEV_BYPASS_AUTH=false`

Then update Supabase Auth settings:

1. Set Site URL to `https://jamshiman.com`
2. Add `https://jamshiman.com/auth/callback` to Redirect URLs
3. Add your Vercel preview callback URLs as secondary redirect URLs for staging tests

After deploy:

1. Sign in with an email listed in `ADMIN_EMAILS`
2. Verify `/admin`, `/admin/advisors`, and `/admin/access`
3. Seed advisors and courses before inviting the first testers

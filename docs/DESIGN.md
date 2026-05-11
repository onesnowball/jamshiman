# jamshiman — Technical Design Summary

## What it is

A verified-only graduate student platform. Students sign in with a `.edu` email via Supabase magic-link OTP (no password). Every action is tied to a real university identity, but all posts and comments are anonymous by default. The platform has four pillars:

1. **Boards** — anonymous department-scoped forums (career, housing, research, etc.)
2. **Advisor reviews** — blind-reviewed ratings of faculty advisors (only shown after 3+ reviews exist for anonymity)
3. **Course reviews & discussions** — grade/difficulty ratings + per-course discussion boards
4. **Schedule builder** — course planner tied to the user's department catalog

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Hosting | Vercel (auto-deploy from `main` branch) |
| Database + Auth | Supabase (PostgreSQL + magic-link OTP) |
| Styling | Tailwind CSS + custom design tokens in `globals.css` |
| Domain | jamshiman.com |

No separate backend. API routes live inside Next.js at `app/api/`. All database access uses the Supabase JS client with the service-role key (enforced auth happens in application code, not RLS).

---

## Repository layout

```
app/
  page.tsx                  ← Landing page (school picker)
  auth/login/               ← OTP login flow
  [school]/                 ← All school-scoped pages
    boards/                 ← Board feed, post detail, new post
    advisors/               ← Advisor list + profile + review form
    courses/                ← Course catalog + course detail
    schedule/               ← Schedule builder
  admin/                    ← Admin dashboard (campus + global)
    flags/                  ← Moderation queue
    users/                  ← User list + [userId] detail
    departments/            ← Board categories + academic depts
    courses/                ← Course management
    advisors/               ← Advisor management
  messages/                 ← DM inbox, thread, compose
  profile/                  ← User profile + own reviews
  api/                      ← All API route handlers

components/
  Navbar.tsx                ← Server component, passes state to NavbarClient
  NavbarClient.tsx          ← Client nav with campus switcher
  SuspensionBanner.tsx      ← Shown to banned users on every page
  admin/                    ← Admin-only client components
  boards/                   ← BoardFeed, PostCard, CommentList, etc.
  forms/                    ← AdvisorReviewForm, CourseReviewForm
  messages/                 ← MessageCompose, ComposeSearch, ChatScrollAnchor
  schedule/                 ← ScheduleBuilder
  ui/                       ← StarRating, FlagButton, etc.

lib/
  server-auth.ts            ← getOptionalViewer, getActionClient, getAdminViewer
  admin-context.ts          ← getAdminUniversity (resolves current school for admins)
  admin-users.ts            ← getAuthEmailMap, toPublicHandle
  supabase/server.ts        ← createClient, createAdminClient
  school.ts                 ← getUniversityBySlug

types/
  database.ts               ← Full TypeScript types for every table

supabase/migrations/        ← Numbered SQL files run manually in Supabase dashboard
```

---

## Database schema (all tables)

### Core identity
- **universities** — `id, name, domain, active` (e.g. `umich.edu`, `northwestern.edu`, `illinois.edu`)
- **users** — `id, email_hash, university_id, dept_id, degree_type, role, is_banned` — `id` matches Supabase Auth UID
- **campus_admins** — `user_id, university_id, granted_by` — junction table for campus admin role

### Content
- **departments** — `university_id, name, slug, active, is_board_category` — `is_board_category=true` marks board topics vs academic departments
- **posts** — `author_id, dept_id, university_id, board_type, title, body, is_anonymous, upvotes, status, course_id`
- **comments** — `post_id, author_id, body, status`
- **upvotes** — `user_id, post_id` (unique constraint prevents double-voting)

### Advisors & courses
- **advisors** — `university_id, dept_id, name, title, lab_name, research_areas[], active`
- **advisor_reviews** — `advisor_id, reviewer_id, ratings (JSONB), original_text, anonymized_text, is_lab_member, status` — shown only when ≥3 reviews exist
- **courses** — `university_id, dept_id, code, name, credits`
- **course_reviews** — `course_id, reviewer_id, semester, ratings (JSONB), original_text, anonymized_text, status`

### Moderation
- **flags** — `reporter_id, content_type, content_id, reason, notes, status` — unique constraint per `(reporter_id, content_type, content_id)`
- **suspension_requests** — `target_user_id, requested_by, university_id, reason, status, reviewed_by` — campus admins submit; global admins approve
- **suspension_appeals** — `user_id, reason, status, reviewed_by` — banned users submit; global admins review
- **audit_log** — `admin_id, action, target_type, target_id, metadata`

### Social
- **messages** — `sender_id, recipient_id, body, read_at` — DMs, per-person thread (not per-post)
- **schedules** — `user_id, university_id, course_ids[]`

---

## Auth & permission model

```
getOptionalViewer()          → any logged-in user (or null)
getActionClient()            → viewer + supabase client for mutations
getAdminViewer()             → global admin OR campus admin for ≥1 university
canAdminUniversity(v, uid)   → true if global admin OR campus admin for that uid
```

**Roles:**
- `student` — default; can post, review, message, flag
- `admin` (global) — full access to all universities, can approve suspension requests, see real email handles, manage campus admins
- campus admin — elevated student; can manage one university's content, advisors, courses, departments; can request (but not directly execute) user suspensions

**School context for admins:** The `last_school` cookie (set by middleware on `/:school/*` visits, or by `/api/admin/set-school`) tells admin pages which university to scope to.

**Suspension:** Sets `is_banned=true` in `users` table AND calls `supabase.auth.admin.updateUserById(id, { ban_duration: '87600h' })` — invalidates session immediately. Unsuspend reverses both.

---

## Key design patterns

### University isolation
Every content table has a `university_id` column. All admin queries are filtered by `university_id`. Cross-university writes are rejected via `canAdminUniversity()`.

### Anonymous-by-default
Posts and comments have `is_anonymous: boolean`. When true, `author_id` is never exposed to other users (only admins can see it via the user detail page). Advisor reviews are always anonymous; shown only after threshold.

### Migration discipline
Every schema change is a numbered SQL file in `supabase/migrations/`. Files are additive only — new columns always have defaults or are nullable; tables are never dropped. This protects live data.

### Content status lifecycle
`active → flagged → pending_delete / archived / removed`
Controlled by campus/global admins. `pending_delete` = author requested deletion (awaiting admin review). `archived` = admin hid it. `removed` = permanently hidden.

### Flag deduplication
Unique constraint on `(reporter_id, content_type, content_id)`. Regular users can flag once; admins upsert back to `pending` to re-flag.

---

## Live universities

| Name | Domain | Slug | Status |
|---|---|---|---|
| University of Michigan | umich.edu | umich | Live |
| Northwestern University | northwestern.edu | northwestern | Live |
| UIUC | illinois.edu | illinois | Live |

---

## Deployment

- **Production:** Push to `main` → Vercel auto-deploys (usually 60–90 seconds)
- **Environment variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_ALLOWED_SCHOOL_DOMAINS`, `ALLOWED_SCHOOL_DOMAINS`
- **Schema changes:** Run the numbered migration SQL manually in the Supabase dashboard SQL editor. There is no automated migration runner yet.

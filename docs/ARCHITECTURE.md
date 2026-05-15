# jamshiman — Architecture Reference

Last updated: 2026-05-15

This document codifies how jamshiman is built. It exists so that future
contributors (human or AI) can ship features without re-deriving the patterns,
and so reviewers can spot drift quickly. **Do not break the invariants
without an explicit decision recorded here.**

For *product* context (what features exist, what's planned, what's skipped),
see `AI_HANDOFF.md` and `PRODUCT_BACKLOG.md`. For known code issues, see
`CODE_QUALITY_REPORT.md`.

---

## 1. Stack at a glance

| Layer | Tech | Pinned |
|---|---|---|
| Framework | Next.js App Router | ^14.2.22 |
| UI | React 18 + Tailwind CSS | — |
| Auth | Supabase Auth (email OTP) | @supabase/ssr ^0.10.3 |
| DB | Supabase Postgres | — |
| Hosting | Vercel | — |
| Forms/validation | `zod` ^3.23.8 | — |
| Icons | `lucide-react` ^0.383.0 | — |
| Animations | Pure CSS keyframes + Tailwind transitions | no Framer Motion |

**Explicitly avoided:** no state library (server components do the work), no
GraphQL, no test framework, no design-system library. ESLint is currently not
wired (interactive `next lint` setup is blocked; see CODE_QUALITY_REPORT).

---

## 2. Trust model

This is the single most important section. Get it wrong and every other
invariant collapses.

### 2.1 Mutations go through service-role, not user-session

Every API route uses `getActionClient()` from [`lib/server-auth.ts`](lib/server-auth.ts).
That function returns the **service-role Supabase admin client** for the
mutation, not the user's session client.

**Consequence:** RLS does **not** protect mutations. Every API route must
explicitly verify, in code, that the caller is allowed to do what they're
asking. The trust boundary is the API route, not the database.

```ts
// Canonical mutation shape — copy this for new routes.
export async function POST(req: NextRequest) {
  const { viewer, supabase } = await getActionClient()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (viewer.is_banned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  if (!isOnboarded(viewer as any)) return NextResponse.json({ error: 'Onboarding required' }, { status: 403 })

  // ... parse + validate body with zod ...

  // School-scope check: target entity must belong to viewer's university.
  const { data: target } = await supabase.from('advisors').select('university_id').eq('id', advisorId).single()
  if (!target || target.university_id !== viewer.university_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ... do the mutation ...
}
```

Routes that skip any of `auth / suspension / onboarding / school-scope` need
an explicit comment justifying it. Examples of legitimate skips: read-only
GETs that return public data; routes that only touch the viewer's own row
(handle change, sign out).

### 2.2 RLS is defense-in-depth, not the boundary

Supabase's default RLS toggle is on (recommended). RLS policies are
intentionally **not** authored for jamshiman tables because mutations bypass
them via service-role. The DB-level enforcement is a future hardening pass,
not a current property.

If you read with the user's session client (rare in this codebase), RLS
*does* apply. Most reads use `createAdminClient()` and ignore RLS.

### 2.3 Session refresh

`middleware.ts` instantiates a server-side Supabase client per request and
calls `auth.getUser()`. This rotates the access token using the refresh
token and writes a new cookie, so user sessions survive past the ~1h access
token TTL. Without it, sessions silently expire.

`getOptionalViewer()` in `lib/server-auth.ts` reads the (possibly just-
refreshed) cookie. After `@supabase/ssr` 0.10 we no longer need the manual
cookie-parsing workaround that 0.3 required.

---

## 3. URL structure & school scoping

### 3.1 The school slug is the primary axis

The canonical URL shape is `/<school>/...`. Examples: `/umich/advisors`,
`/umich/departments/meche`, `/umich/pulse`. The `<school>` segment is a
normalized slug (`umich`, `northwestern`, `uiuc`) mapped to a university's
`domain` field.

`lib/school-slugs.ts` defines:
- `canonicalSchoolSlug()` — folds aliases (e.g., `uiuc` ↔ `illinois.edu`).
- `isSchoolPathSlug()` — distinguishes school slugs from reserved app paths
  (`/auth`, `/profile`, `/messages`, etc.).

**Adding a new school requires three things:** an active row in `universities`
with a `.edu` domain, a slug alias in `school-slugs.ts` if it differs from
the domain prefix, and email-domain enforcement in `lib/auth.ts`.

### 3.2 Legacy root routes

Pre-school routes still exist at `/advisors`, `/courses`, `/boards`,
`/schedule`. These are currently **full duplicates** of the school-scoped
versions, not thin redirects. They redirect via cookie when possible and
otherwise render their own copy. This is technical debt — see CODE_QUALITY_REPORT P1-3.

**For new features, never add a legacy root route.** Always `/[school]/...`.

### 3.3 Departments are tags, not tabs

Departments aren't a peer of advisors/courses — they're a way to **slice**
them. The dept page (`/[school]/departments/[dept]`) is a curated landing
that links *into* the global advisor/course pages, pre-filtered by dept.

The global pages accept `?dept=<slug>&area=<keyword>` and render dismissible
filter chips. This was the design fix landed 2026-05-15.

---

## 4. Data model invariants

The schema lives in `supabase/migrations/`. TypeScript types live in
`types/database.ts` (currently out of sync — see CODE_QUALITY_REPORT P1-1).

### 4.1 Core entities

| Table | Owns | Cross-references |
|---|---|---|
| `universities` | School (UMich, UIUC, etc.) | — |
| `departments` | Academic dept OR board topic (via `is_board_category`) | `university_id` |
| `users` | Verified student/admin | `university_id`, `dept_id` |
| `advisors` | Faculty | `university_id`, primary `dept_id`, plus `advisor_department_affiliations` for cross-listings |
| `courses` | Course catalog | `university_id`, `dept_id` |
| `advisor_reviews` | Lab/advisor review | `advisor_id`, `reviewer_id` (one per pair, DB-unique) |
| `course_reviews` | Course review | `course_id`, `reviewer_id`, `semester` (DB-unique per triple) |
| `posts` | Board or course-discussion post | `university_id`, `dept_id`, `course_id` (`board_type ∈ {department,course}`) |
| `comments` | Reply to post | `post_id` (school-scoped via post) |

### 4.2 Grad Pulse V1 (migration 019)

| Table | Purpose |
|---|---|
| `daily_checkins` | Per-user daily mood/sleep/stress. Unique on `(user_id, checkin_date)`. Retention: 90 days raw. |
| `pulse_daily_aggregates` | Anonymized roll-ups per dept/status. Used by Pulse dashboard. |
| `user_xp_ledger` | Idempotent XP awards. Unique on `(user_id, idempotency_key)`. |
| `advisor_review_requests` | "Request a review" demand signal. Unique on `(user_id, advisor_id)`. |
| `reward_catalog` | Scaffold only — no redemption UI yet. |

### 4.3 Hard invariants (DB-enforced)

- **One advisor review per user per advisor** — `advisor_reviews` unique
  index on `(advisor_id, reviewer_id)`.
- **One course review per user per course per semester** — unique on
  `(course_id, reviewer_id, semester)`.
- **One pending flag per user per content item** — unique on
  `(reporter_id, content_type, content_id)` where `status='pending'`.
- **One advisor-review-request per user per advisor** — unique on
  `(user_id, advisor_id)`.
- **School integrity triggers** (migration 016) — advisors/courses/posts
  can't reference a department from a different university.

### 4.4 Soft invariants (API-enforced)

- **5-minute post cooldown** for non-global-admin users in `/api/posts`.
- **k-anonymity ≥ 5** on Pulse aggregates — never expose dept/status stats
  unless `unique_user_count >= 5`.
- **No raw check-in data exposed** — Pulse summary returns only aggregates.
- **XP is idempotent** — every `awardXp()` call uses a stable
  `idempotency_key` derived from the action (e.g., `daily_checkin:<userId>:<date>`).

---

## 5. Auth + onboarding flow

```
unauthed → /auth/login (email OTP)
       ↓
verified, no profile → /api/auth/setup creates `users` row
       ↓
profile exists, no onboarding → /profile/onboarding (academic_status, dept_id, handle, attestation)
       ↓
onboarded → app
```

**Onboarding gating** is enforced in three places that wrap most of the
app:
- `app/[school]/layout.tsx` — every school-scoped route.
- `app/profile/page.tsx` and `app/profile/[...subroute]/page.tsx` — profile (except `/profile/onboarding`).
- `app/messages/*` — every messages page.

If you add a new top-level authed route, gate it the same way:

```ts
const viewer = await getOptionalViewer()
if (!viewer) redirect('/auth/login')
if (!isOnboarded(viewer as any)) redirect('/profile/onboarding')
```

The dev bypass cookie (`NEXT_PUBLIC_DEV_BYPASS_AUTH=true` + cookie set) skips
auth entirely. **Never depend on this in production reasoning.**

---

## 6. Caching policy

This took several iterations to get right. Read this before changing
anything in `next.config.js` or adding `dynamic` exports.

### 6.1 What we want

Data should be live. After an admin adds an advisor, the next user
navigation (soft, not Cmd+R) should show it. After a user posts, their
feed updates without a full reload.

### 6.2 What's between user and DB

Four caches:

1. **Next.js Router Cache** (client-side, in-memory, per session) — caches
   rendered server components for soft navigations.
2. **Vercel Edge / CDN** — caches HTTP responses by URL.
3. **Next.js Full Route Cache** — build-time prerender.
4. **Next.js Data Cache** — per `fetch()` (doesn't apply to Supabase JS).

### 6.3 What we set

For all school-scoped routes and `/profile`:

| Layer | Setting | Where |
|---|---|---|
| Router Cache | `staleTimes: { dynamic: 0, static: 0 }` | `next.config.js` |
| CDN | `Cache-Control: no-store, must-revalidate` | `next.config.js` headers() rule |
| Full Route Cache | `export const dynamic = 'force-dynamic'` | each page |
| Full Route Cache | `export const revalidate = 0` | each page |
| Data Cache | `unstable_noStore()` | top of each server component |

Currently applied consistently to **school-scoped pages and the dept
detail/list, advisor detail/list pages.** Many other authed pages are
missing one or more of these — see CODE_QUALITY_REPORT P2-1.

---

## 7. Component organization

```
components/
├── Navbar.tsx, NavbarClient.tsx, SuspensionBanner.tsx     # top-level
├── ui/                            # primitive UI (StarRating, RollingNumber)
├── brand/                         # Jami mascot, confetti, celebrations
├── advisors/, courses/, course/   # area-specific listings + search
├── department/                    # dept-page-only widgets (LastActivityLine, ActivityStrip)
├── boards/, forms/                # post composition + feed
├── messages/                      # DM UI
├── profile/                       # profile widgets (HandleEditor, SignOutButton)
├── pulse/                         # check-in + dashboard
├── admin/                         # admin tools
└── schedule/                      # private schedule builder
```

### 7.1 Server vs client

- **Server components by default.** Pages, list rendering, queries.
- **Client components** are explicitly marked with `'use client'`. Used for
  anything with state, animations driven by JS, or browser APIs.
- **Brand components** (`components/brand/*`) are all client because they
  drive their own timers and intersection observers.

### 7.2 The brand component contract

`<JamMascot state="..." size="..." />`, `<EmptyStateIllustration variant="..." />`,
`<CuteLoader />`, `<ContributionCelebration show={...} />`, `<CapybaraLurker />`.

The mascot art lives in one place: `components/brand/JamMascot.tsx` +
`components/brand/CapybaraSprite.tsx` + `components/brand/capybara-sprites.ts`.
Pages never inline mascot SVG. Designer assets can later replace the
internals without touching any page.

---

## 8. Lib helpers (where shared logic lives)

```
lib/
├── server-auth.ts        # getOptionalViewer, getActionClient, canAdminUniversity
├── supabase/{client,server}.ts
├── school.ts, school-slugs.ts, advisor-departments.ts, admin-users.ts
├── auth.ts               # email domain + university lookup
├── onboarding.ts         # isOnboarded, requireOnboardedViewer
├── celebrate.ts          # navigation-survivable celebration queue
├── format/relative-time.ts  # canonical timeAgo() — see CODE_QUALITY_REPORT P1-2
├── department-activity.ts   # dept-scoped activity aggregates
├── pulse/{date,options,privacy,aggregates}.ts
├── xp/awardXp.ts
├── content.ts, anonymous-handles.ts, dev-bypass.ts
└── admin-context.ts
```

**Rule of thumb:** if logic is used by ≥2 callers, extract to `lib/`. If a
helper grows past ~80 lines, split it into a subfolder.

---

## 9. Code conventions

- **TypeScript strict-ish**, but `as any` is used liberally for Supabase JS
  query results when the table type isn't in `types/database.ts`. This is
  technical debt. New tables must be added to `types/database.ts` in the same
  PR as the migration.
- **Error responses** from APIs are `{ error: string }` with appropriate
  HTTP status. Client code displays `data.error` if present.
- **Naming**: `*Page.tsx` for routes, `*Form.tsx` for forms,
  `*Button.tsx` for buttons, `*Card.tsx` / `*List.tsx` for layout.
- **Migrations** are numbered `NNN_short_description.sql` and idempotent
  (`if not exists`, `insert ... where not exists`, `update ... where`).
  Apply order matters; don't fold a later migration into an earlier one.

---

## 10. Open invariants future contributors must preserve

These have been costly to get right. Don't regress them.

- Verified university email OTP login.
- School-scoped content visibility — every page/API must scope by
  `viewer.university_id` or `university.id` from URL slug.
- Anonymous posting/review behavior — `posts.is_anonymous` flag,
  `advisor_reviews.anonymized_text`. Profile shows the user their own
  original text; nothing else should.
- One review per pair (advisor, course).
- 5-min post cooldown for non-admins.
- Pulse k-anonymity (≥ 5).
- XP idempotency per `(user, action, target)`.
- No exposure of raw `daily_checkins` rows to other users.
- Onboarding gate on every authed route.
- Session refresh in middleware.

---

## 11. Things this app deliberately does NOT do

For reviewers tempted to "fix" these:

- **No client-side Supabase mutations.** All writes go through Next.js API
  routes. This is intentional — see Trust Model.
- **No GraphQL / no ORM.** Plain Supabase JS queries are easier to audit.
- **No state library.** Server components fetch; client components reach
  back to APIs.
- **No Framer Motion / Lottie / etc.** Inline SVG + CSS keyframes are
  enough.
- **No automatic email/SMS notifications.** Out of scope until product
  validates.
- **No public XP leaderboard.** XP is private to encourage contribution,
  not status games.
- **No undergrad access.** UMich grad only for beta.

# Code Quality Report — 2026-05-15

Audit of the jamshiman codebase: drift, duplication, gaps, and dead code.
Pure cleanup — no new features. Ranked P0 (must fix) → P3 (nice-to-have).

For each item: **what's wrong**, **why it matters**, **specific fix**.

> **Companion docs:** `ARCHITECTURE.md` for the patterns we should be following.
> `UX_REVIEW_2026-05-15.md` for user-facing flow issues (separate concern).

---

## P0 — Security / correctness gaps

### P0-1 — Several API mutations don't check `is_banned`

**Where:** [`app/api/votes/route.ts`](app/api/votes/route.ts),
[`app/api/schedules/route.ts`](app/api/schedules/route.ts),
[`app/api/schedule-courses/route.ts`](app/api/schedule-courses/route.ts),
[`app/api/comments/[id]/route.ts`](app/api/comments/[id]/route.ts),
[`app/api/messages/[userId]/route.ts`](app/api/messages/[userId]/route.ts).

**Why it matters:** Per `ARCHITECTURE.md` §2.1, every mutation must verify
suspension status before writing. Suspended users can currently upvote,
build schedules, edit comments they own, and DM specific users. The
suspension banner is shown to them but the API doesn't refuse.

**Fix:** Add `if (viewer.is_banned) return 403` near the top of each route.
~3 lines per file. Audit checklist:

```bash
# Find mutation routes missing the check:
for f in $(find app/api -name "route.ts"); do
  if grep -q "POST\|PATCH\|PUT\|DELETE" "$f" && \
     grep -q "getActionClient" "$f" && \
     ! grep -q "is_banned" "$f"; then
    echo "$f"
  fi
done
```

### P0-2 — Cross-school holes in messages, votes, flags, schedule-courses

Already documented in `AI_HANDOFF.md` §5 ("Risk areas to inspect"). Still
unfixed. Specifically:
- **`/api/messages` POST** — doesn't verify recipient's `university_id` matches
  sender. A user knowing a target's user-id can DM cross-school.
- **`/api/votes` POST** — doesn't verify the voted post/comment is in the
  viewer's school.
- **`/api/flags` POST** — doesn't verify the reported content belongs to a
  school the viewer can see (matters for cross-school content filtering, less
  for moderation).
- **`/api/schedule-courses` POST** — verifies schedule ownership but not that
  the selected `course_id` is in the user's school.

**Fix:** Each is 2–4 lines. Fetch target, compare `university_id`, return
403 if mismatch. Mirror the pattern in [`app/api/reviews/route.ts`](app/api/reviews/route.ts:42).

---

## P1 — Architecture drift (compounding cost if left alone)

### P1-1 — `types/database.ts` is missing 5 tables → 155 `as any` casts

**Where:** [`types/database.ts`](types/database.ts), and every file that touches Grad Pulse tables.

**Why it matters:** Migration 019 added `daily_checkins`, `pulse_daily_aggregates`,
`user_xp_ledger`, `advisor_review_requests`, `reward_catalog`. None are in
`types/database.ts`. Every query against them uses `(supabase as any)`. There
are currently **155 `as any` casts** across `app/` `components/` `lib/`.

This means TypeScript can no longer catch column misspellings on the new
tables. The contract has degraded.

**Fix:** Add the five table types to `types/database.ts` matching their
migration definitions, then sweep `as any` casts that are no longer needed.
Estimated effort: 30 min for types, 1 hour for the sweep. Suggested order:

1. Add types.
2. Remove `as any` from `lib/pulse/*`, `lib/xp/*`, `lib/onboarding.ts`, `lib/department-activity.ts`.
3. Remove from `app/api/pulse/*`, `app/api/profile/onboarding/`, `app/api/advisors/[id]/request-review/`.
4. Leave admin-only `as any` casts alone for now (those tables are also under-typed).

### P1-2 — `timeAgo()` duplicated 4 times in 4 different shapes

**Where:** [`lib/format/relative-time.ts`](lib/format/relative-time.ts) (canonical),
plus duplicates in:
- [`app/messages/page.tsx:14-23`](app/messages/page.tsx:14) — uses minutes/hours/days/weeks
- [`app/[school]/page.tsx:13-21`](app/[school]/page.tsx:13) — minutes/hours/days/weeks
- [`app/[school]/departments/[dept]/page.tsx:15-22`](app/[school]/departments/[dept]/page.tsx:15) — days only ("today", "Nd", "Nw")
- [`components/boards/BoardFeed.tsx`](components/boards/BoardFeed.tsx) — its own variant

**Why it matters:** Same date can render as "30m ago", "1h ago", or "today"
depending on which page you're on. Real consistency issue.

**Fix:** Pick one shape (the `lib/format/relative-time.ts` one is probably
fine but consider adding finer granularity for recent timestamps). Delete the
other three. ~30 min.

### P1-3 — Legacy root routes are full duplicates, not redirects

**Where:** [`app/advisors/page.tsx`](app/advisors/page.tsx),
[`app/courses/page.tsx`](app/courses/page.tsx),
[`app/boards/page.tsx`](app/boards/page.tsx),
[`app/schedule/page.tsx`](app/schedule/page.tsx).

**Why it matters:** Each is 100–200 lines and re-implements the school-scoped
version of the same page. They redirect when `last_school` cookie is set, but
otherwise render their own copy of the data fetching and UI. Any change to
the canonical page (e.g., adding the `?dept=` filter from 2026-05-15) has to
be mirrored to the legacy one — and isn't.

**Fix:** Reduce each to a thin server component that:
1. Reads `last_school` cookie (or falls back to viewer's `university.domain`).
2. `redirect()` to `/<slug>/<feature>` preserving search params.
3. Renders nothing otherwise (or a "pick a school" page if no slug resolvable).

Saves ~600 lines and stops the drift. Estimated effort: 1 hour.

### P1-4 — Migrations 020–023 are superseded by 024 but still in the repo

**Where:** [`supabase/migrations/020_*.sql`](supabase/migrations/) through `023_*.sql`.

**Why it matters:** Migration 024 (`umich_meche_faculty_combined.sql`) is the
one-shot replacement. Anyone running migrations in order will run 020, then
021, then 022, then 023, then a no-op 024 (idempotent). Works, but the four
intermediate files are dead weight and confuse new readers.

**Fix:** Either:
- (a) Delete 020–023 and document that 024 is canonical.
- (b) Add a header comment at the top of each saying "Superseded by 024;
  kept for migration-order replay only."

I'd pick (a) — they're idempotent and 024 produces the same end state.
~5 min.

### P1-5 — Three routes do dept lookup by name, not slug

**Where:** Migrations 020/022/023/024 — they fall back to `name ilike '%mechanical engineering%'`
because the actual dept slug is `meche`, not `mechanical-engineering`.

**Why it matters:** Future schools added via admin UI may have slug values
that don't match expectations, and these migrations will silently match the
wrong department (e.g., a Northwestern dept also named "Mechanical Engineering").

**Fix:** Either:
- Standardize slug values across all schools (`update departments set slug = 'mechanical-engineering' where ...`).
- Or scope the fallback to a single university by also filtering
  `university_id = v_university_id` in the ilike clause (already in place).

The latter is already done in the migrations, so this is *not* an active
bug — but worth flagging for future faculty migrations to keep the same
pattern.

---

## P2 — Convention drift

### P2-1 — Most authed pages miss `dynamic = 'force-dynamic'` + `noStore()`

**Where:** 30 of ~42 `page.tsx` files have no `dynamic` export. Notable:
- `/profile`, `/messages`, `/messages/[userId]`, `/messages/compose`
- All admin pages
- All `/boards/*` (legacy root)
- All `/[school]/boards/*`, `/[school]/admin/*`, `/[school]/schedule`

**Why it matters:** Per `ARCHITECTURE.md` §6, all four caches need to be
defeated for live data. Currently only the dept page, advisor pages, and
courses page are fully covered. Other authed pages can show stale data after
mutations until Cmd+R.

**Fix:** Add to top of each authed server page:
```ts
import { unstable_noStore as noStore } from 'next/cache'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MyPage() {
  noStore()
  // ...
}
```

Could be batched into a single sweep PR. ~20 min.

### P2-2 — Mix of `'use client'` boundary placements

Some areas mark a tiny leaf (e.g., a single button) as `'use client'`, others
mark a whole search-results wrapper. There's no documented rule. Most pages
get this right organically but it's worth deciding:

**Recommendation:** put `'use client'` at the **smallest stateful unit**.
List rendering with a search input stays client; the list item card can be a
child server component when possible. Currently `AdvisorSearch` and
`CourseSearch` are fully client, which is fine (every row has hover/focus
state).

No fix needed — just document in `ARCHITECTURE.md`. Already done in §7.1.

### P2-3 — Inconsistent error UI

Form errors live in three shapes across the codebase:
- Red box with icon: `BoardPostForm`, `NewPostForm`, login.
- Inline red text under field: `GradOnboardingForm`.
- Toast / alert: nowhere consistently.

**Fix:** Pick one. The red-box-with-icon pattern is most common; standardize
that. Could be a `<FormError>` component in `components/ui/`. ~15 min.

### P2-4 — `console.error` left in production code

**Where:** [`PendingDeleteActions.tsx:39`](app/[school]/admin/flags/PendingDeleteActions.tsx),
[`FlagActions.tsx:30`](app/[school]/admin/flags/FlagActions.tsx),
[`ArchiveActions.tsx:36`](app/[school]/admin/flags/ArchiveActions.tsx).

**Why:** Admin-only console.error is mostly harmless but pollutes browser
console and can leak info. Replace with a proper error UI or a no-op.

---

## P3 — Polish

### P3-1 — TODO: raw check-in cleanup helper not scheduled

**Where:** [`lib/pulse/aggregates.ts:121`](lib/pulse/aggregates.ts:121) —
`cleanupOldCheckins()` exists but no cron / Vercel scheduled function wires it.

**Why:** Privacy invariant says raw `daily_checkins` retain for 90 days. The
helper is correct; nothing runs it.

**Fix:** Vercel cron is the lightest option:
```js
// vercel.json
{
  "crons": [{ "path": "/api/cron/cleanup-checkins", "schedule": "0 4 * * *" }]
}
```
Plus a thin `/api/cron/cleanup-checkins/route.ts` that calls the helper and
returns OK. ~15 min plus a Vercel env config for auth.

### P3-2 — Unused / dead imports

A spot-check shows occasional unused imports (e.g., some pages import `Plus`
or `ArrowRight` icons in conditional branches that no longer render). Low
impact but ESLint with `no-unused-vars` would surface them.

**Fix:** Bundled with P3-3.

### P3-3 — ESLint never set up

**Where:** `npm run lint` triggers an interactive `next lint` setup that's
been deferred each session.

**Why it matters:** No automated catch of unused imports, missing keys,
React-hook deps, or accessibility basics. The codebase is small enough that
nothing's exploded yet.

**Fix:** Add `.eslintrc.json`:
```json
{ "extends": "next/core-web-vitals" }
```
Then run `npm run lint --fix` to clean up trivially-fixable issues. Add to
CI later. ~10 min.

### P3-4 — Dependency on `@supabase/ssr` experimental field

`next.config.js` uses `experimental.staleTimes`. The flag is stable in 14.2+
but is still under `experimental`. Watch the Next 15 release notes — when we
upgrade, the field path may change.

No fix needed — just a flag for the upgrade ticket.

### P3-5 — Mascot art is placeholder

The pixel-art capybara is functional but not designer-finalized. Component
architecture supports a drop-in replacement via
`public/brand/jami/jami-<state>.svg`. Awaiting designer.

Tracked in `PRODUCT_BACKLOG.md` engineering-debt section.

---

## What I'd delete entirely

> *"Pick one thing you'd delete entirely. Stuff I built but don't need."*

**The legacy root routes** (`app/advisors/page.tsx`, `app/courses/page.tsx`,
`app/boards/page.tsx`, `app/schedule/page.tsx`). They're 600+ lines of dead
duplication that re-implement the school-scoped versions. They serve only
to cushion the URL change from pre-school to school-scoped, which already
happened and is settled. Replace each with a 5-line `redirect()`.

See P1-3 for the exact change.

---

## Top 3 to do this week

1. **P1-1** — Add the 5 missing tables to `types/database.ts` and remove
   ~80% of the `as any` casts. Single biggest win for ongoing safety.
2. **P0-1 + P0-2** — Audit & fix the API routes missing `is_banned` /
   cross-school checks. ~30 min total but they're real holes.
3. **P1-3** — Delete the four legacy root pages, replace with redirects.
   Removes 600 lines and a permanent source of drift.

After those three the codebase is in a noticeably healthier state.
Everything else is genuine polish.

---

## What's NOT in this report

- **UX/copy/flow issues** — already covered in `UX_REVIEW_2026-05-15.md`.
  This report is purely code-quality.
- **Performance** — page load times are fine at current scale (<50 users).
  Revisit when traffic justifies it.
- **Test coverage** — there are no tests, by design. When the product
  stabilizes, the first tests should cover migrations + the API trust model.
- **Database performance** — migrations are simple; aggregate computations
  are in-memory in `lib/pulse/aggregates.ts`. Will need indexes when
  `daily_checkins` grows past ~50k rows.

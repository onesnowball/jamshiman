# jamshiman Product Backlog

Living list of considered features, why they're queued or skipped, and
what's next. Update at the end of every planning session. Paste this
back into Claude.ai when re-planning so we don't re-decide the same things.

Last updated: 2026-05-15

---

## On deck (next session candidate, pre-decided)

_Empty. Next planning session needed._

---

## Shipped (recent)

- 2026-05-15 — **Department activity signals**: "last activity" line
  + 12-week GitHub-contrib-style strip (suppressed unless ≥3 of last
  12 weeks have activity). Two commits: ead58ef (Part A) and 8c0a35d
  (Part B). Detroit-week math in `lib/pulse/date.ts`. No schema change.

- 2026-05-14 — **Grad Pulse V1**: onboarding, daily check-in,
  k-anonymity aggregate dashboard, XP scaffold, advisor request-review,
  Jami mascot system, empty states. (commits b9f084b…cca4a95)
- 2026-05-15 — **Confetti + livelier mascot**: maize/blue confetti on
  post creation and reviews, navigation-survivable celebration queue,
  mascot animation made visible. (commit 990ee58)
- 2026-05-15 — **Auth session refresh**: upgraded `@supabase/ssr`
  0.3→0.10, added middleware refresh so users stay logged in across
  browser restarts and token rotation. (commit cca4a95)

---

## Skipped, with reason (don't re-pitch these without new context)

- **Weekly Pulse digest** — needs ≥10 posts/week to feel alive; at
  <50 users it would actively signal deadness. Revisit at ~150 users
  or ~10 posts/week.
- **"Was this helpful?" on reviews** — sorting/ranking signal only
  useful when there are ≥5 reviews per advisor/course. Also introduces
  performative-contribution dynamics; cuts against beta-stage incentive
  to contribute honestly. Revisit when any advisor/course has 5+ reviews.
- **Saved / bookmarks** — write-only feature without notifications.
  Fragments the personal-utility surface (schedule builder already
  owns that). Only revisit alongside a notification system.
- **Personal mood trend on Pulse** — health-adjacent feature in a
  social app is a category mismatch. Asymmetric downside (rough month
  → worse experience). If revisited, must be a separate opt-in surface,
  not a chart on Pulse.

---

## Engineering debt / scaffolding TODOs

These are not features. They are loose ends from prior work that should
be addressed when convenient or when they start hurting.

- **Migration 019 applied to prod?** — verify Pulse routes actually
  work end-to-end on jamshiman.com after deploy. ⚠️ blocking for Pulse.
- **Raw check-in 90-day retention** — `cleanupOldCheckins()` helper
  exists in `lib/pulse/aggregates.ts` but no scheduler. Set up a
  Supabase scheduled function, Vercel cron, or run manually for now.
- **Reward marketplace** — `reward_catalog` table is a stub.
  Redemption UI does not exist. Don't build until there is a
  catalog item worth redeeming.
- **`docs/ARCHITECTURE.md`** — promised in session 2026-05-15; doesn't
  exist yet. Should codify: server-comp + thin-API pattern, swappable
  brand components, RLS posture, push-to-main workflow.
- **RLS defense-in-depth pass** — every mutation uses service-role,
  so RLS doesn't enforce anything at the DB layer today. Add a sweep
  later: enable RLS on every table, write real read/write policies,
  switch mutations to user-session client where it makes sense.
- **Mascot designer assets** — current Jami is inline SVG placeholder.
  Architecture supports drop-in replacement via
  `public/brand/jami/jami-<state>.svg`. Awaiting designer.
- **Lint** — `npm run lint` is blocked by interactive `next lint`
  setup. Decide: add `next/core-web-vitals` ESLint config, or accept
  no lint and rely on `tsc --noEmit`.

---

## How to add to this list

Two kinds of entries: **on deck** (next thing to build) and
**skipped** (and why). When a planning session ends:

1. Move the chosen feature into "On deck".
2. Move skipped candidates into "Skipped, with reason" with the
   tripwire condition that would make it worth revisiting.
3. When something ships, move it to "Shipped (recent)" with the
   commit hash(es).

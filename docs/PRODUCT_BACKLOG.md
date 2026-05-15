# jamshiman Product Backlog

Living list of considered features, why they're queued or skipped, and
what's next. Update at the end of every planning session. Paste this
back into Claude.ai when re-planning so we don't re-decide the same things.

Last updated: 2026-05-15

---

## On deck (next session candidate, pre-decided)

_Empty._ Run a planning session in Claude.ai to pick the next feature.
Use the template at the bottom of this doc.

Three lanes worth considering for the next session:

1. **More schools / more departments** — replicate the MechE pattern
   (faculty + courses migrations) for EECS, IOE, ChemE, Aero, or for
   Northwestern / UIUC. Pure data work; no UI changes.
2. **Cleanup pass before any new feature** — burn down `CODE_QUALITY_REPORT.md`
   top 3 (types, is_banned audit, legacy-route deletion). About 3h of work,
   meaningfully healthier codebase after.
3. **New feature on top of Pulse infra** — XP redemption marketplace, weekly
   Pulse digest (revisit threshold; see Skipped), survival prompts on dept
   pages, advisor Q&A surface.

---

## Shipped (recent, newest first)

- 2026-05-15 — **Architecture + code-quality docs** introduced
  (`ARCHITECTURE.md`, `CODE_QUALITY_REPORT.md`) and `AI_HANDOFF.md` refreshed.
  No code changes.
- 2026-05-15 — **IA cleanup**: departments became tags, not duplicates.
  Dept page now shows research-area chips + capped advisor/course previews;
  global advisor/course pages accept `?dept=&area=` filters with dismissible
  chip UI. (commit `98ec608`)
- 2026-05-15 — **UMich MechE courses**: 74 graduate courses (500/600-level,
  no special-topics/research) seeded via migration 025.
- 2026-05-15 — **UMich MechE faculty**: 101 tenure-track faculty seeded via
  migrations 020–024 (combined: 024 is canonical).
- 2026-05-15 — **Department activity signals**: "last activity" line +
  12-week GitHub-style strip on dept pages, suppressed unless ≥3 of 12
  weeks have activity. Detroit-week buckets.
- 2026-05-15 — **Trumpet-style maize/blue confetti + pixel-art capybara**
  Jami with grad cap, walking/sleeping/eating animations, bottom-right
  Lurker that wanders and chases carrots.
- 2026-05-15 — **Cache nuke for school routes**: Next 14.2.3 → 14.2.22,
  `Cache-Control: no-store` headers, `noStore()` on advisor/dept pages.
  Fixes stale-after-migration symptom.
- 2026-05-15 — **Sign-out button** on `/profile`.
- 2026-05-14 — **Auth session refresh** via middleware (`@supabase/ssr`
  0.3 → 0.10). Users stay logged in across browser restarts.
- 2026-05-14 — **Grad Pulse V1**: onboarding (`/profile/onboarding`),
  daily anonymous check-in, k-anonymity Pulse dashboard, Campus XP scaffold,
  advisor "request a review" button, Jami mascot system, empty states,
  contribution celebrations.

---

## Skipped, with reason (don't re-pitch these without new context)

- **Weekly Pulse digest** — needs ≥10 posts/week to feel alive; at <50
  users it would actively signal deadness. **Revisit at ~150 users or
  ~10 posts/week.**
- **"Was this helpful?" on reviews** — sorting/ranking signal only useful
  when there are ≥5 reviews per advisor/course. Also introduces performative-
  contribution dynamics; cuts against beta-stage incentive to contribute
  honestly. **Revisit when any advisor/course has 5+ reviews.**
- **Saved / bookmarks** — write-only feature without notifications.
  Fragments the personal-utility surface (schedule builder already owns
  that). **Only revisit alongside a notification system.**
- **Personal mood trend on Pulse** — health-adjacent feature in a social
  app is a category mismatch. Asymmetric downside (rough month → worse
  experience). **If revisited, must be a separate opt-in surface, not a
  chart on Pulse.**
- **Dev playground / Preview MCP / local Supabase** — overhead exceeds
  benefit at single-user testing scale. **Revisit if the project grows to
  multiple active contributors.**
- **AI advisor match quiz** — explicitly held back during Grad Pulse V1
  planning. **No revisit window set; product-led decision.**
- **Meme feed** — out of scope. Not aligned with the verified-knowledge
  positioning.
- **Lab/advisor/cohort tracking in onboarding** — privacy invariant
  intentionally rejects this. **Do not re-add even if requested without
  explicit privacy reconsideration.**
- **Full rewards redemption marketplace** — scaffold table exists
  (`reward_catalog`) but redemption UI is out of scope. **Revisit when
  there's an actual reward worth redeeming.**

---

## Engineering debt / scaffolding TODOs

Not features. Loose ends from prior work, ranked by ROI.

- **CODE_QUALITY_REPORT.md "Top 3 this week"** — types, is_banned audit,
  legacy-route deletion. ~3 hours total.
- **Raw check-in 90-day retention** — `cleanupOldCheckins()` helper exists
  in `lib/pulse/aggregates.ts` but no scheduler. Vercel cron is the
  lightest option. ~15 min when there's time.
- **ESLint setup** — `npm run lint` blocked by interactive Next.js setup.
  Add `.eslintrc.json` with `{"extends":"next/core-web-vitals"}` to unblock.
  ~10 min.
- **Mascot designer assets** — current pixel-art Jami is placeholder.
  Architecture supports drop-in replacement via
  `public/brand/jami/jami-<state>.svg`. Awaiting designer.
- **RLS defense-in-depth** — every mutation uses service-role; RLS
  doesn't enforce anything at the DB layer. Add a sweep later that enables
  RLS on every table, authors read/write policies, and switches mutations
  to user-session client where it makes sense. Multi-hour project.
- **Migration 020-023 cleanup** — superseded by 024. Either delete or
  add a "kept for replay" header. (See CODE_QUALITY_REPORT P1-4.)
- **UX_REVIEW_2026-05-15.md top 4** — duplicate handle setup, Pulse
  invisibility on school home, recent-post links, mobile lurker overlap.
  ~2 hours total.

---

## How to add to this list

Two kinds of entries: **on deck** (next thing to build) and
**skipped** (and why). When a planning session ends:

1. Move the chosen feature into "On deck".
2. Move skipped candidates into "Skipped, with reason" with the
   tripwire condition that would make it worth revisiting.
3. When something ships, move it to "Shipped (recent)" with the
   commit hash(es).

---

## Planning-session prompt template

Paste this (along with `AI_HANDOFF.md`, this file, `ARCHITECTURE.md`,
and `CODE_QUALITY_REPORT.md` / `UX_REVIEW_2026-05-15.md`) into Claude.ai
when running a session:

```
You're helping me plan the next feature on jamshiman — a verified-
university platform for UMich grad students (Next.js 14 + Supabase).

I'm pasting four context docs first. Use them to ground your suggestions.
DO NOT re-pitch anything in the "Skipped, with reason" section unless
the tripwire condition is met.

Constraints:
- UMich grad only. No undergrad. No lab/advisor/cohort tracking.
- Single-user testing (just me, <10 beta users).
- Push directly to main. Migrations applied by hand in Supabase SQL editor.
- Architecture: server components + Supabase service-role API routes
  that self-check auth/scope. (See ARCHITECTURE.md.)
- App is called "jamshiman" only — never "Grad Pulse" or "GradPeer" in UI.
- No new state libraries, no GraphQL, no test framework.

Goal of next feature: <FILL IN>

I want you to:
1. List 5 candidate features ranked by impact-vs-effort for a beta with
   <50 users.
2. For each: one-sentence pitch, the smallest viable version, what data
   model change it needs, what could go wrong.
3. Recommend the top pick and tell me why.
4. End with: the exact prompt I should give my coding agent (Claude Code)
   to build the top pick — including specific file paths, expected
   behavior, and edge cases to handle.

Don't suggest features that need a real ML model or external paid service
for V1.
```

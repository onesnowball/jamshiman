# GradPeer / jamshiman Agent Guide

Before exploring broadly, inspect this AGENTS.md and docs/AI_HANDOFF.md first. Prefer targeted file inspection over scanning the whole repository.

Do not check Vercel deployment status, production deployment logs, or external hosting status unless the user explicitly asks. For normal feature work, focus on local code, local build/test/typecheck, and the requested files.

## App Purpose

GradPeer / jamshiman is a verified university platform for advisor reviews, lab culture, course advice, department survival, and anonymous school-scoped discussion. Students sign in with a university email, are assigned to a university, and use school-scoped routes such as `/umich/advisors`, `/umich/courses`, and `/umich/boards`. The app is Next.js 14 App Router plus Supabase, with admin-managed campus data, moderation, private schedules, profile activity, and lightweight direct messages. Preserve verified identity, school scoping, anonymity, and moderation behavior when making changes.

## Main Route / File Map

| Area | Routes | Primary files |
|---|---|---|
| Public entry/auth | `/`, `/auth/login`, `/auth/callback` | `app/page.tsx`, `app/auth/login/page.tsx`, `app/auth/callback/route.ts`, `app/api/auth/setup/route.ts` |
| School shell/home | `/[school]` | `app/[school]/layout.tsx`, `app/[school]/page.tsx`, `components/Navbar.tsx`, `components/NavbarClient.tsx` |
| Advisors | `/[school]/advisors`, `/[school]/advisors/[id]` | `app/[school]/advisors/*`, `components/advisors/AdvisorSearch.tsx`, `components/forms/AdvisorReviewForm.tsx`, `app/api/reviews/route.ts` |
| Departments | `/[school]/departments`, `/[school]/departments/[dept]` | `app/[school]/departments/*`, admin department/board managers |
| Courses | `/[school]/courses`, `/[school]/courses/[id]` | `app/[school]/courses/*`, `components/courses/CourseSearch.tsx`, `components/forms/CourseReviewForm.tsx`, `components/course/CourseDiscussionTab.tsx`, `app/api/course-reviews/route.ts` |
| Boards/discussion | `/[school]/boards`, `/[school]/boards/new`, `/[school]/boards/[dept]`, `/[school]/boards/[dept]/[postId]` | `app/[school]/boards/*`, `components/boards/*`, `components/forms/*PostForm.tsx`, `app/api/posts/*`, `app/api/comments/*`, `app/api/votes/route.ts` |
| Course discussion | `/[school]/courses/[id]?tab=discussion`, `/[school]/courses/[id]/discussion/[postId]` | `components/course/CourseDiscussionTab.tsx`, `components/forms/NewCourseThreadForm.tsx`, `app/[school]/courses/[id]/discussion/[postId]/page.tsx` |
| Messages | `/messages`, `/messages/compose`, `/messages/[userId]` | `app/messages/*`, `components/messages/*`, `app/api/messages/route.ts` |
| Schedule | `/[school]/schedule` | `app/[school]/schedule/page.tsx`, `components/schedule/ScheduleBuilder.tsx`, `app/api/schedules/route.ts`, `app/api/schedule-courses/route.ts` |
| Profile | `/profile` | `app/profile/page.tsx`, `components/profile/*`, `app/api/profile/handle/route.ts` |
| Admin/moderation | `/[school]/admin/*` | `app/[school]/admin/*`, `components/admin/*`, `app/api/admin/*`, `app/api/flags/route.ts`, `app/api/appeal/route.ts` |
| Auth/scoping helpers | N/A | `middleware.ts`, `lib/server-auth.ts`, `lib/admin-context.ts`, `lib/school.ts`, `lib/school-slugs.ts`, `lib/auth.ts` |
| Schema | N/A | `supabase/migrations/*`, `types/database.ts` |

Legacy root routes like `/advisors`, `/courses`, `/boards`, `/schedule`, and `/admin` may exist as redirects or older fallbacks. Prefer school-scoped routes for new work.

## Key Product Areas

- Advisors: search/list/detail, advisor reviews, lab/research text, aggregates, extra department affiliations.
- Departments: academic department pages combine advisors, courses, recent posts, and board topic links.
- Courses: course catalog, course reviews, course discussion, schedule integration through course IDs.
- Boards: anonymous or named school-scoped posts, comments, votes, flags, pin/archive/admin actions.
- Messages: direct messages mainly discoverable through non-anonymous board authors.
- Schedule: private manual timetable drafts from seeded courses.
- Profile: private activity, submitted reviews, schedules, handle editing.
- Admin: campus data management, flags, content removal, campus admins, suspension requests, appeals.

## Security / Scoping Rules

- Auth uses Supabase email OTP and university email domains. Relevant files: `app/auth/login/page.tsx`, `app/auth/callback/route.ts`, `app/api/auth/setup/route.ts`, `lib/auth.ts`.
- `users.university_id` is the core school scope. Most school pages resolve the URL school and query by `university.id`.
- `getActionClient()` in `lib/server-auth.ts` returns a service-role admin client for mutations. This means API routes must explicitly check auth, school scope, suspension, ownership, and role permissions.
- School slug handling lives in `lib/school-slugs.ts` and `middleware.ts`. Do not break reserved top-level route segments.
- Anonymous content must not expose author identity publicly. Non-anonymous display uses `users.handle` or helper logic in `lib/admin-users.ts`.
- Suspended users should be blocked from posting, commenting, reviewing, flagging, messaging, and profile handle changes where current APIs enforce it.
- Regular users are scoped to their own school. Campus admins are scoped by `campus_admins.university_id`. Global admins are `users.role='admin'`.
- Preserve post cooldown in `app/api/posts/route.ts`.
- Preserve one advisor review per user/advisor and current course review uniqueness behavior unless explicitly changing the product.
- Be especially careful around `app/api/messages/route.ts`, `app/api/votes/route.ts`, `app/api/flags/route.ts`, and `app/api/schedule-courses/route.ts`; these are lighter on school checks than the core review/post APIs.

## Preferred Files To Inspect First

- Advisor feature work: `app/[school]/advisors/page.tsx`, `app/[school]/advisors/[id]/page.tsx`, `components/advisors/AdvisorSearch.tsx`, `components/forms/AdvisorReviewForm.tsx`, `app/api/reviews/route.ts`.
- Course feature work: `app/[school]/courses/page.tsx`, `app/[school]/courses/[id]/page.tsx`, `components/courses/CourseSearch.tsx`, `components/course/CourseDiscussionTab.tsx`, `app/api/course-reviews/route.ts`.
- Department beta work: `app/[school]/departments/[dept]/page.tsx`, `app/[school]/departments/page.tsx`, board and course/advisor components as needed.
- Board/discussion work: `app/[school]/boards/*`, `components/boards/*`, `components/forms/BoardPostForm.tsx`, `app/api/posts/*`, `app/api/comments/*`.
- Auth/school-scope work: `lib/server-auth.ts`, `middleware.ts`, `lib/school-slugs.ts`, `lib/school.ts`, auth routes.
- Admin/moderation work: `app/[school]/admin/*`, `components/admin/*`, `app/api/admin/*`, `app/api/flags/route.ts`.
- Schema work: `supabase/migrations/*` and `types/database.ts`.

## Files / Directories To Avoid Unless Directly Relevant

- `.next/` and generated build artifacts.
- `node_modules/`.
- Vercel metadata/config or deployment state.
- Old root fallback routes unless the task is specifically about redirects or legacy URLs.
- Admin/security internals unless the task touches permissions, moderation, authentication, or school scoping.
- Broad docs or strategy files after this guide and `docs/AI_HANDOFF.md` have enough context.

## Local Validation Commands

- `npm run lint`
- `npm run build`
- `npm run dev`

Use targeted manual checks against local school-scoped routes after UI changes, for example `/umich/advisors`, `/umich/courses`, `/umich/boards`, `/umich/departments`, and `/umich/schedule`.

## Token-Saving Rules for Future AI Agents

- Do not re-audit the full repository unless explicitly requested.
- Do not inspect admin/security internals unless the task touches permissions, moderation, authentication, or school scoping.
- Do not check deployment status unless explicitly requested.
- Do not browse unrelated feature areas.
- Start from the route/file map in `docs/AI_HANDOFF.md`.
- For feature work, inspect only the route, component, data-access, and schema files directly involved.
- Preserve existing security, anonymity, moderation, and school-scoping behavior.

## Handoff Maintenance Rule

When the user explicitly asks to update the handoff, or when a major feature/change is completed and the user says to document it, update the appropriate handoff files.

Use:

- `docs/AI_HANDOFF.md` for product/engineering architecture, route maps, feature wiring, security/scoping notes, and next-build priorities.
- `AGENTS.md` for short persistent instructions future AI agents should follow.

Do not update handoff files after every tiny edit. Update them only when:

- a new major feature is added,
- routes or navigation change,
- data models/schema change,
- security/scoping/permission logic changes,
- important architecture changes are made,
- the user explicitly says "update the handoff," "document this," "save this for future agents," or similar.

When updating handoff files:

- Keep them concise.
- Do not duplicate stale information.
- Replace outdated sections instead of appending endlessly.
- Include changed routes/files/components.
- Include any new invariants future agents must not break.
- Include any new known limitations or follow-up tasks.

When the user explicitly asks to document a completed feature or update the handoff, update `docs/AI_HANDOFF.md` and/or `AGENTS.md` so future AI agents do not need to rediscover the same context.

## Things Not To Waste Time On Unless Explicitly Requested

- Vercel deployment status, production deployment logs, or external hosting status.
- Reconstructing the whole file tree after reading `docs/AI_HANDOFF.md`.
- Re-explaining Next.js or Supabase basics.
- Generated `.next` diffs.
- Broad product brainstorming when the user asked for a narrow code change.

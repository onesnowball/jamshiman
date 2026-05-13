# GradPeer / jamshiman Engineering + Product Handoff

Last updated: 2026-05-13

This handoff is for future AI coding agents working locally in this repo. It intentionally focuses on product behavior, route wiring, data models, school scoping, anonymity, moderation, and likely next feature work. It does not cover Vercel deployment status or production hosting.

## 1. One-Paragraph Product Summary

GradPeer / jamshiman is a verified university platform for advisor reviews, lab culture, course advice, department survival, and anonymous campus/department discussion. Students sign in with a university email, are scoped to their school, and can browse advisors, departments, courses, course reviews, course discussion threads, anonymous board posts, direct messages, private schedules, and their own profile activity. The product is not just a generic anonymous board: its differentiator is tying verified campus identity to school-scoped academic data, advisor/lab-specific reviews, course-level advice, and moderated anonymity.

## 2. User-Facing Feature Inventory

| Area | Exists? | Main user actions | Key routes/pages | Key files/components | Notes |
|---|---|---|---|---|---|
| Authentication / onboarding | Exists | Choose school, request OTP, verify code, set handle | `/`, `/auth/login`, `/auth/callback`, `/auth/setup` | `app/page.tsx`, `app/auth/login/page.tsx`, `app/auth/callback/route.ts`, `app/api/auth/setup/route.ts`, `lib/auth.ts`, `lib/server-auth.ts`, `middleware.ts` | Email domain and active university are checked before creating/updating `users`. Login redirects toward school-scoped pages. |
| Home / dashboard | Partial | Pick campus, view school dashboard, jump to main areas | `/`, `/[school]` | `app/page.tsx`, `app/[school]/page.tsx`, `components/Navbar.tsx`, `components/NavbarClient.tsx` | School dashboard exists but could do more for new users and cold-start contribution prompts. |
| Departments | Exists | Browse departments, view department landing page, find advisors/courses/posts | `/[school]/departments`, `/[school]/departments/[dept]` | `app/[school]/departments/page.tsx`, `app/[school]/departments/[dept]/page.tsx`, admin department managers | Academic departments are school-scoped. Board topics are also stored in `departments` with `is_board_category=true`. |
| Advisors | Exists | Search advisors, view detail, read reviews, submit review | `/[school]/advisors`, `/[school]/advisors/[id]` | `app/[school]/advisors/page.tsx`, `app/[school]/advisors/[id]/page.tsx`, `components/advisors/AdvisorSearch.tsx`, `components/forms/AdvisorReviewForm.tsx`, `app/api/reviews/route.ts` | Advisor cards include department/lab/research text and aggregates when reviews exist. |
| Advisor reviews | Exists | Submit one advisor review, read active reviews, report reviews | `/[school]/advisors/[id]` | `AdvisorReviewForm`, `app/api/reviews/route.ts`, `components/FlagButton.tsx`, `advisor_reviews`, `advisor_aggregates` | One review per user per advisor is enforced in DB/API. Review text currently displays immediately if active. |
| Courses | Exists | Search courses, view detail, read reviews, open discussion | `/[school]/courses`, `/[school]/courses/[id]` | `app/[school]/courses/page.tsx`, `app/[school]/courses/[id]/page.tsx`, `components/courses/CourseSearch.tsx` | Course cards show reviews and discussion counts. |
| Course reviews | Exists | Submit course review, read active reviews, report reviews | `/[school]/courses/[id]` | `components/forms/CourseReviewForm.tsx`, `app/api/course-reviews/route.ts`, `components/FlagButton.tsx` | DB unique index allows one review per user per course per semester. API error text implies one per course, so confirm intended behavior before changing. |
| Boards / anonymous discussion | Exists | Browse board feed, filter/search, create post, comment, upvote, report | `/[school]/boards`, `/[school]/boards/new`, `/[school]/boards/[dept]`, `/[school]/boards/[dept]/[postId]` | `BoardFeed`, `BoardPostForm`, `NewPostForm`, `UnifiedPostForm`, `PostActions`, `CommentActions`, `UpvoteButton`, `app/api/posts`, `app/api/comments`, `app/api/votes` | Posts are school-scoped, department/topic-scoped, and can be anonymous. 5-minute post cooldown for non-global-admin users. |
| Course discussion | Exists | Create course thread, comment, report | `/[school]/courses/[id]?tab=discussion`, `/[school]/courses/[id]/discussion/[postId]` | `CourseDiscussionTab`, `NewCourseThreadForm`, `CommentForm`, `app/api/posts`, `app/api/comments` | Course discussions reuse `posts`/`comments` with `board_type='course'` and `course_id`. |
| Direct messages | Partial | View conversations, compose to visible contacts, chat, unread badges | `/messages`, `/messages/compose`, `/messages/[userId]` | `app/messages/*`, `components/messages/ComposeSearch.tsx`, `components/messages/MessageCompose.tsx`, `app/api/messages/route.ts` | Compose UI lists non-anonymous post authors from viewer's school. Send API does not appear to re-check recipient school. |
| Schedule builder | Partial | Create private schedules, add/edit/remove course meeting blocks | `/[school]/schedule` | `app/[school]/schedule/page.tsx`, `components/schedule/ScheduleBuilder.tsx`, `app/api/schedules`, `app/api/schedule-courses` | Private manual timetable builder. UI loads school courses; API verifies schedule ownership but not course school membership. |
| Profile / account | Exists | View own reviews/posts/comments/schedules, edit handle, request delete | `/profile` | `app/profile/page.tsx`, `HandleEditor`, `ProfileActivity`, `app/api/profile/handle` | Profile page is private. Non-anonymous display name is `users.handle`. |
| Flagging / reporting | Exists | Report review/post/comment, undo own pending flag | Any content page with `FlagButton` | `components/FlagButton.tsx`, `app/api/flags/route.ts`, `app/[school]/admin/flags/page.tsx`, `app/api/admin/flags/route.ts` | Flags feed admin moderation. Normal users can submit one pending report per content item. |
| Search | Partial | Search/filter advisors, courses, boards locally | Advisors/courses/boards pages | `AdvisorSearch`, `CourseSearch`, `BoardFeed`, `ComposeSearch` | No global cross-feature search found. |
| Notifications / unread indicators | Partial | Message unread badges | `/messages`, navbar profile/messages area | `app/messages/page.tsx`, `NavbarClient` | No review-request notifications, digests, or cross-feature notification center found. |
| Admin/moderation affecting normal users | Exists | Content removal, pinned/archived posts, user suspension, appeals | `/[school]/admin/*`, `/api/admin/*`, `/api/appeal` | `app/[school]/admin/*`, admin components, `SuspensionBanner` | Campus admins and global admins differ. Suspended users are blocked from key mutations and can appeal. |

## 3. Route-to-File Map

| Route | Purpose | Page/layout file | Main child components | Data/API/server actions used | Notes |
|---|---|---|---|---|---|
| `/` | Public campus picker | `app/page.tsx` | Campus cards | `universities` public data | First screen for unauthenticated users. |
| `/auth/login` | OTP login and handle setup | `app/auth/login/page.tsx` | Inline client form | Supabase OTP, `/api/auth/setup`, `/api/profile/handle` | Checks allowed school domains client-side; API/server does authoritative setup. |
| `/auth/callback` | Supabase auth callback | `app/auth/callback/route.ts` | N/A | Supabase session exchange, `universities`, `users` | Upserts user, assigns university, redirects to school route. |
| `/[school]` | School dashboard | `app/[school]/layout.tsx`, `app/[school]/page.tsx` | `Navbar`, cards/lists | `getUniversityBySlug`, `departments`, `posts`, `advisor_reviews` | Authenticated school home; good target for contribution prompts. |
| `/[school]/advisors` | Advisor directory | `app/[school]/advisors/page.tsx` | `AdvisorSearch` | `advisors`, `departments`, `advisor_aggregates`, `advisor_department_affiliations` | School-scoped by `university.id`. |
| `/[school]/advisors/[id]` | Advisor detail and reviews | `app/[school]/advisors/[id]/page.tsx` | `AdvisorReviewForm`, `FlagButton` | `advisor_reviews`, `advisor_aggregates`, `/api/reviews`, `/api/flags` | Validates advisor belongs to school. |
| `/[school]/departments` | Department directory | `app/[school]/departments/page.tsx` | Department cards | `departments`, advisor/course counts | Only academic departments (`is_board_category=false`). |
| `/[school]/departments/[dept]` | Department landing page | `app/[school]/departments/[dept]/page.tsx` | Advisor/course/post sections | `departments`, `advisors`, `courses`, `posts`, aggregates | A key route for making departments feel alive. |
| `/[school]/courses` | Course directory | `app/[school]/courses/page.tsx` | `CourseSearch` | `courses`, `departments`, `course_reviews`, course discussion counts | School-scoped course catalog. |
| `/[school]/courses/[id]` | Course detail, reviews, discussion tab | `app/[school]/courses/[id]/page.tsx` | `CourseReviewForm`, `CourseDiscussionTab`, `FlagButton` | `/api/course-reviews`, `/api/posts`, `/api/comments`, `/api/flags` | Query tab controls reviews/discussion. |
| `/[school]/courses/[id]/discussion/[postId]` | Course discussion thread detail | `app/[school]/courses/[id]/discussion/[postId]/page.tsx` | `CommentForm`, `FlagButton`, post actions | `posts`, `comments`, `/api/comments`, `/api/votes` | Uses same post/comment model as boards. |
| `/[school]/boards` | School-wide board feed | `app/[school]/boards/page.tsx` | `BoardFeed` | `posts`, `departments`, votes/comments counts | Filters include board categories and academic departments. |
| `/[school]/boards/new` | Create a department/topic post | `app/[school]/boards/new/page.tsx` | `NewPostForm` | `/api/posts`, `departments` | Redirects regular users to their own school if cross-school. |
| `/[school]/boards/[dept]` | Department/topic board | `app/[school]/boards/[dept]/page.tsx` | `BoardPostForm`, post list | `posts`, `/api/posts` | Reader-open; posting requires auth. |
| `/[school]/boards/[dept]/[postId]` | Board thread detail | `app/[school]/boards/[dept]/[postId]/page.tsx` | `CommentForm`, `PostActions`, `CommentActions`, `FlagButton`, `UpvoteButton` | `posts`, `comments`, `/api/comments`, `/api/votes`, `/api/flags` | Handles owner/admin actions and anonymous display. |
| `/messages` | Conversation inbox | `app/messages/page.tsx` | `Navbar`, conversation list | `messages`, `getAuthEmailMap` | School context comes through navbar/last_school, not URL. |
| `/messages/compose` | Pick a message contact | `app/messages/compose/page.tsx` | `ComposeSearch` | Non-anonymous `posts` authors from viewer school | Limited contact discovery. |
| `/messages/[userId]` | DM thread | `app/messages/[userId]/page.tsx` | `MessageCompose`, `ChatScrollAnchor` | `messages`, `/api/messages` | Marks incoming messages as read. |
| `/[school]/schedule` | Private schedule builder | `app/[school]/schedule/page.tsx` | `ScheduleBuilder` | `schedules`, `schedule_courses`, `/api/schedules`, `/api/schedule-courses` | Courses for picker are school-scoped. |
| `/profile` | Private account/activity page | `app/profile/page.tsx` | `HandleEditor`, `ProfileActivity` | `advisor_reviews`, `course_reviews`, `posts`, `comments`, `schedules`, `/api/profile/handle` | Shows user's own original review text and activity. |
| `/[school]/admin` | Admin dashboard | `app/[school]/admin/page.tsx` | Admin nav cards | `getAdminViewer`, `requireAdminUniversity`, counts | Admin-only, school-scoped. |
| `/[school]/admin/flags` | Flag review and content moderation | `app/[school]/admin/flags/page.tsx` | `PendingDeleteActions`, `ArchiveActions` | `flags`, content tables, `/api/admin/flags` | Normal users are affected through removals/archive decisions. |
| `/[school]/admin/users` and `/[school]/admin/users/[userId]` | User moderation, suspension requests, appeals | `app/[school]/admin/users/page.tsx`, `app/[school]/admin/users/[userId]/page.tsx` | `UserBanButton`, `CampusAdminButton`, `SuspensionRequestButton`, `SuspensionReviewButtons` | `/api/admin/users`, `/api/admin/suspension-requests`, `/api/admin/appeals` | Campus admins request suspension; global admins approve. |
| `/[school]/admin/departments`, `/boards`, `/courses`, `/advisors`, `/access` | Campus data management | `app/[school]/admin/*/page.tsx` | Admin manager components | `/api/admin/departments`, `/api/admin/courses`, `/api/admin/advisors`, `/api/admin/campus-admins` | Affects what normal users can browse/post to. |

Legacy root routes such as `/advisors`, `/courses`, `/boards`, `/schedule`, and `/admin` still exist as redirects or older fallbacks. For new feature work, prefer the school-scoped `/:school/...` routes.

## 4. Feature Wiring Map

### Advisors
- Main route(s): `/[school]/advisors`, `/[school]/advisors/[id]`.
- Page file(s): `app/[school]/advisors/page.tsx`, `app/[school]/advisors/[id]/page.tsx`.
- Main components: `components/advisors/AdvisorSearch.tsx`, `components/forms/AdvisorReviewForm.tsx`, `components/FlagButton.tsx`.
- Data models/tables involved: `universities`, `departments`, `advisors`, `advisor_department_affiliations`, `advisor_reviews`, `advisor_aggregates`, `flags`.
- API routes/server actions/queries: school pages use `createAdminClient()` and scope by `university.id`; review submit goes to `app/api/reviews/route.ts`; reporting goes to `app/api/flags/route.ts`.
- School/department scoping logic: advisor listing/detail require advisor `university_id` to match the URL school. Review API verifies advisor `university_id === viewer.university_id`.
- Review submission flow: client form validates ratings/text, POSTs `advisor_id`, ratings, text, lab-member relationship to `/api/reviews`; API requires viewer, rejects suspended users, inserts `advisor_reviews`.
- Important constraints: DB unique index on `(advisor_id, reviewer_id)` means one advisor review per user. Advisor detail shows active reviews immediately. UI sends `lab_atmosphere`, but the API rating schema currently lists five core rating keys; confirm before building lab-culture analytics.
- Files likely touched for future advisor improvements: advisor pages, `AdvisorSearch`, `AdvisorReviewForm`, `app/api/reviews/route.ts`, migrations for request-review/Q&A/research keywords, admin advisor manager/API.

### Departments
- Main route(s): `/[school]/departments`, `/[school]/departments/[dept]`.
- Page file(s): `app/[school]/departments/page.tsx`, `app/[school]/departments/[dept]/page.tsx`.
- Main components: department cards in page files; admin managers in `components/admin/DepartmentAdminManager.tsx`, `AcademicDeptManager`, `BoardTopicManager`.
- Data models/tables involved: `universities`, `departments`, `advisors`, `advisor_department_affiliations`, `courses`, `posts`, review aggregates.
- API routes/server actions/queries: read queries in page files; admin mutations via `app/api/admin/departments/route.ts`.
- School/department scoping logic: department slug is resolved within URL school; academic departments use `is_board_category=false`; board topics use the same table with `is_board_category=true`.
- Important constraints: `016_school_scoping_integrity.sql` includes triggers/indexes to keep department/university relationships consistent.
- Files likely touched for future department improvements: department detail page, department list page, board pages, admin department/board topic managers, migrations for department homepage content if needed.

### Courses
- Main route(s): `/[school]/courses`, `/[school]/courses/[id]`.
- Page file(s): `app/[school]/courses/page.tsx`, `app/[school]/courses/[id]/page.tsx`.
- Main components: `components/courses/CourseSearch.tsx`, `components/forms/CourseReviewForm.tsx`, `components/course/CourseDiscussionTab.tsx`.
- Data models/tables involved: `courses`, `departments`, `course_reviews`, `posts`, `comments`, `flags`, `schedules`, `schedule_courses`.
- API routes/server actions/queries: course review submit via `app/api/course-reviews/route.ts`; course discussion threads via `app/api/posts/route.ts`; comments via `app/api/comments/route.ts`.
- School/department scoping logic: listing/detail query courses by `university_id`; review API verifies course belongs to viewer school; discussion post API verifies course school unless global admin.
- Important constraints: course code unique per university. Course reviews unique by `(course_id, reviewer_id, semester)`.
- Files likely touched for future course improvements: course list/detail pages, `CourseSearch`, `CourseReviewForm`, `CourseDiscussionTab`, course admin manager/API, review-request migrations.

### Course Reviews
- Main route(s): `/[school]/courses/[id]`.
- Page file(s): `app/[school]/courses/[id]/page.tsx`.
- Main components: `CourseReviewForm`, `FlagButton`.
- Data models/tables involved: `course_reviews`, `courses`, `users`, `flags`.
- API routes/server actions/queries: `app/api/course-reviews/route.ts`.
- School scoping logic: API selects `courses(id, university_id)` and rejects cross-school submission.
- Review submission flow: form collects semester, four ratings, and text; API inserts `course_reviews` with `original_text` and `anonymized_text`.
- Important constraints: suspended users cannot submit. DB allows one review per course/user/semester. Active reviews display on course detail.
- Files likely touched for future course review improvements: `CourseReviewForm`, course detail page, `app/api/course-reviews/route.ts`, migrations for review requests/usefulness summaries.

### Advisor Reviews
- Main route(s): `/[school]/advisors/[id]`.
- Page file(s): `app/[school]/advisors/[id]/page.tsx`.
- Main components: `AdvisorReviewForm`, `FlagButton`.
- Data models/tables involved: `advisor_reviews`, `advisor_aggregates`, `advisors`, `users`, `flags`.
- API routes/server actions/queries: `app/api/reviews/route.ts`.
- School scoping logic: API rejects if advisor school differs from viewer school.
- Review submission flow: ratings/text/lab relationship -> `/api/reviews` -> insert active review.
- Important constraints: one review per user per advisor; suspended users blocked; active reviews are visible.
- Files likely touched for future advisor review improvements: `AdvisorReviewForm`, advisor detail page, review API, migrations for lab-culture prompts/request-review counts.

### Boards / Posts / Comments
- Main route(s): `/[school]/boards`, `/[school]/boards/new`, `/[school]/boards/[dept]`, `/[school]/boards/[dept]/[postId]`.
- Page file(s): `app/[school]/boards/page.tsx`, `app/[school]/boards/new/page.tsx`, `app/[school]/boards/[dept]/page.tsx`, `app/[school]/boards/[dept]/[postId]/page.tsx`.
- Main components: `BoardFeed`, `BoardPostForm`, `NewPostForm`, `UnifiedPostForm`, `CommentForm`, `PostActions`, `CommentActions`, `UpvoteButton`, `FlagButton`.
- Data models/tables involved: `posts`, `comments`, `post_votes`, `comment_votes`, `departments`, `users`, `flags`.
- API routes/server actions/queries: `app/api/posts/route.ts`, `app/api/posts/[id]/route.ts`, `app/api/comments/route.ts`, `app/api/comments/[id]/route.ts`, `app/api/votes/route.ts`.
- School/department scoping logic: posts carry `university_id`, `dept_id`, and optional `course_id`; create API checks department/course belongs to viewer university unless global admin. Pages resolve URL school and department slug.
- Anonymous/display logic: `posts.is_anonymous` controls public label. Non-anonymous posts show handle/email-derived label and can expose a message action.
- Important constraints: non-global-admin users have a 5-minute post cooldown. Owner deletes become `pending_delete`; admins can remove/archive/pin. Vote API should be treated carefully because it is lighter on school checks than post/comment APIs.
- Files likely touched for future boards improvements: board pages, post/comment API routes, board components, migrations for topics/Q&A/request prompts.

### Course Discussion
- Main route(s): `/[school]/courses/[id]?tab=discussion`, `/[school]/courses/[id]/discussion/[postId]`.
- Page file(s): `app/[school]/courses/[id]/page.tsx`, `app/[school]/courses/[id]/discussion/[postId]/page.tsx`.
- Main components: `CourseDiscussionTab`, `NewCourseThreadForm`, `CommentForm`, `FlagButton`.
- Data models/tables involved: same `posts` and `comments` tables, with `posts.board_type='course'` and `posts.course_id`.
- API routes/server actions/queries: `app/api/posts/route.ts`, `app/api/comments/route.ts`, `app/api/votes/route.ts`.
- School scoping logic: route validates course is in URL school; create API validates course school against viewer school.
- Important constraints: `002_course_discussions.sql` constrains course posts to require `course_id`; department posts must not have `course_id`.
- Files likely touched for future course Q&A: `CourseDiscussionTab`, `NewCourseThreadForm`, course detail page, post/comment APIs, migrations for Q&A metadata if separate from posts.

### Messages
- Main route(s): `/messages`, `/messages/compose`, `/messages/[userId]`.
- Page file(s): `app/messages/page.tsx`, `app/messages/compose/page.tsx`, `app/messages/[userId]/page.tsx`.
- Main components: `ComposeSearch`, `MessageCompose`, `ChatScrollAnchor`.
- Data models/tables involved: `messages`, `users`, non-anonymous `posts` for contact discovery.
- API routes/server actions/queries: `app/api/messages/route.ts`.
- School scoping logic: compose page only lists non-anonymous post authors from viewer's university. The message POST route validates auth/self/suspension but does not appear to verify the recipient belongs to the same school.
- Important constraints: messages are private between sender/recipient; incoming messages get `read_at` set on thread load. No global notification center.
- Files likely touched for future messages: message pages/components/API, navbar unread count if added, possible recipient school check.

### Schedule Builder
- Main route(s): `/[school]/schedule`.
- Page file(s): `app/[school]/schedule/page.tsx`.
- Main components: `ScheduleBuilder`.
- Data models/tables involved: `schedules`, `schedule_courses`, `courses`, `users`.
- API routes/server actions/queries: `app/api/schedules/route.ts`, `app/api/schedule-courses/route.ts`.
- School scoping logic: page loads course options for URL school; schedule rows are scoped by `user_id`.
- Important constraints: schedule and schedule blocks are private to owner. `schedule-courses` API verifies schedule ownership, but currently does not verify selected `course_id` belongs to viewer school.
- Files likely touched for future schedule work: schedule page/component, schedule APIs, migrations if meetings/sections/import are added.

### Profile
- Main route(s): `/profile`.
- Page file(s): `app/profile/page.tsx`.
- Main components: `HandleEditor`, `ProfileActivity`.
- Data models/tables involved: `users`, `advisor_reviews`, `course_reviews`, `posts`, `comments`, `schedules`.
- API routes/server actions/queries: `app/api/profile/handle/route.ts`, owner delete through post/comment APIs.
- School scoping logic: profile uses viewer id for all private data. Activity links derive school slug from joined `universities.domain`.
- Important constraints: handle must be lowercase letters/numbers/underscore, 3-20 chars, unique. Profile exposes own original review text.
- Files likely touched for profile/account work: profile page, profile components, handle API.

### Flags / Reporting
- Main route(s): content routes with `FlagButton`, `/[school]/admin/flags`.
- Page file(s): `app/[school]/admin/flags/page.tsx`.
- Main components: `FlagButton`, admin flag action components.
- Data models/tables involved: `flags`, content tables (`advisor_reviews`, `course_reviews`, `posts`, `comments`), `audit_log`.
- API routes/server actions/queries: `app/api/flags/route.ts`, `app/api/admin/flags/route.ts`.
- School scoping logic: admin flag page and API scope moderation actions with `canAdminUniversity` and content university lookups. Public flag creation is auth-protected but should be reviewed before expanding cross-school behavior.
- Important constraints: one pending report per user/content item via DB unique index; suspended users cannot flag; admins can resolve reports and remove/archive content.
- Files likely touched for reporting improvements: `FlagButton`, flag APIs, admin flags page/components, migrations for new report reasons/statuses.

## 5. Security, Scoping, and Permissions Map

### Authentication
- Login is Supabase email OTP from `app/auth/login/page.tsx`.
- The client validates the email domain against `NEXT_PUBLIC_ALLOWED_SCHOOL_DOMAINS`, then verifies the OTP with Supabase.
- `app/api/auth/setup/route.ts` and `app/auth/callback/route.ts` map email domain to an active `universities` row, hash the email into `users.email_hash`, upsert `users`, and set `users.university_id`.
- `lib/server-auth.ts` has the main session helpers: `getOptionalViewer`, `getActionClient`, `getAdminViewer`, `canAdminUniversity`.
- `middleware.ts` redirects unauthenticated users away from non-public paths and maintains a `last_school` cookie for navbar/admin context.
- There is a dev bypass path/cookie for local development. Do not rely on it for production-like security reasoning.

### School Scoping
- Users are associated with one school through `users.university_id`.
- School URL slugs are normalized in `lib/school-slugs.ts`; `uiuc` maps to `illinois.edu`; top-level app routes are reserved so they are not mistaken for schools.
- `app/[school]/layout.tsx` and school pages resolve URL school through `getUniversityBySlug`.
- Most user-facing pages query by `university.id`. Important API routes also compare target entity school to `viewer.university_id`.
- Server mutations use a service-role admin client through `getActionClient`, so API-level checks are critical. Do not assume Supabase RLS will save a mutation if the route skipped scoping.
- DB triggers in `supabase/migrations/016_school_scoping_integrity.sql` enforce several school relationship invariants for advisors, courses, posts, and users.
- Risk areas to inspect before feature work: `app/api/messages/route.ts`, `app/api/votes/route.ts`, `app/api/flags/route.ts`, and `app/api/schedule-courses/route.ts` have lighter school checks than the core post/review creation APIs.

### Anonymity
- Board/course-discussion posts use `posts.is_anonymous`.
- Anonymous posts display anonymous labels/pseudonyms; non-anonymous posts use `users.handle` or an email-derived public label from `lib/admin-users.ts`.
- Reviews store `original_text` and `anonymized_text`. Current submission APIs set anonymized text equal to original text; display pages use review text fields directly. Treat review text as privacy-sensitive.
- Profile shows a user's own original review text and activity; public pages should not expose reviewer identity.
- Non-anonymous board authors can be contacted through messages; anonymous authors should not expose message actions.

### Roles and Permissions

| Role | Capabilities | Scope | Where enforced |
|---|---|---|---|
| Regular verified user | Browse school content, submit reviews, post/comment, vote, flag, message, build private schedules, edit handle | Own university for school-scoped content; own account/schedules | `middleware.ts`, `getOptionalViewer`, route queries, `/api/reviews`, `/api/course-reviews`, `/api/posts`, `/api/comments`, `/api/schedules`, `/api/profile/handle` |
| Campus admin | Manage moderation/content/users for assigned campus; manage campus data where allowed; request suspensions | `campus_admins.university_id` entries | `getAdminViewer`, `canAdminUniversity`, `requireAdminUniversity`, `/[school]/admin/*`, `/api/admin/*` |
| Global admin | Admin across all universities; assign campus admins; approve suspension requests/appeals; exempt from some posting limits | All active universities | `users.role='admin'`, `getAdminViewer`, global branches in admin/API code |
| Department-level role | Missing/none found | N/A | No department-scoped role table or checks found |

### Moderation
- Flagging/reporting: normal users click `FlagButton`; `app/api/flags/route.ts` creates a `flags` row with content type/reason/notes and lets the reporter undo a pending report.
- Content removal flow: owner delete for posts/comments sets `pending_delete`; admin flag actions can mark content removed/archived and resolve pending flags.
- Account suspension flow: campus/global admins can request suspension; only global admins approve suspension requests; direct unban is available through admin user tooling; suspended users can submit appeals through `app/api/appeal/route.ts`; global admins review appeals through `app/api/admin/appeals/route.ts`.
- Admin pages: `/[school]/admin`, `/[school]/admin/flags`, `/[school]/admin/users`, `/[school]/admin/users/[userId]`, plus data management pages for departments/boards/courses/advisors/access.
- Normal users see suspended state through `SuspensionBanner` and receive API 403s for key mutations.

## 6. Data Model / Entity Relationship Summary

| Entity | Represents | Related to | Scope | Important fields/concepts | Main files/queries |
|---|---|---|---|---|---|
| School | University/campus | Users, departments, advisors, courses, posts, campus admins | Global row, active/inactive | `universities.domain` maps to URL slug; `active` gates auth/setup and listings | `lib/school.ts`, `lib/school-slugs.ts`, `app/page.tsx`, school routes |
| Department | Academic department or board topic | Advisors, courses, posts | University | `slug`, `active`, `is_board_category`; board topics are stored here too | department pages, board pages, admin department APIs |
| User | Verified account profile | Reviews, posts, comments, schedules, messages, flags, admin roles | University | `email_hash`, `university_id`, `role`, `is_banned`, `handle`, `degree_type` | `lib/server-auth.ts`, auth routes, profile/admin users |
| Advisor | Faculty/advisor listing | Department, extra department affiliations, advisor reviews | University | `dept_id`, `name`, `title`, `lab`, `research`, `active` | advisor pages, admin advisor API |
| Advisor review | Student review of advisor/lab | Advisor, reviewer, flags | Advisor/user school | `ratings` JSON, `original_text`, `anonymized_text`, `status`, `is_lab_member`; unique advisor/user | advisor detail, `/api/reviews`, `advisor_aggregates` |
| Course | Course catalog item | Department, course reviews, discussions, schedules | University | `code`, `name`, `description`, unique code per university | course pages, schedule page, admin courses |
| Course review | Student course feedback | Course, reviewer, flags | Course/user school | `semester`, `ratings`, `original_text`, `anonymized_text`, `status`; unique course/user/semester | course detail, `/api/course-reviews` |
| Board topic | Non-academic board category | Posts | University | Stored as `departments` with `is_board_category=true` | boards page, admin boards/departments |
| Board post | Department/topic discussion thread | Author, department, comments, votes, flags | University/department | `board_type='department'`, `is_anonymous`, `status`, `is_pinned`, cooldown | board pages, `/api/posts` |
| Comment | Reply to board or course discussion post | Post, author, votes, flags | Inherits post scope | `status`, owner delete -> `pending_delete` | post detail pages, `/api/comments` |
| Course discussion post/comment | Course-specific Q&A/discussion | Course, department, comments | University/course | Same `posts`/`comments` tables; `board_type='course'`, `course_id` required | `CourseDiscussionTab`, course discussion route, `/api/posts` |
| Message/thread | Direct messages between users | Sender, recipient | User-pair; intended school-adjacent | `sender_id`, `recipient_id`, `read_at`; thread is derived from message pairs | `app/messages/*`, `/api/messages` |
| Schedule | Private timetable draft | User, schedule courses, courses | Owner | `user_id`, `name`, `semester`; private | schedule page, `/api/schedules` |
| Schedule block | Course meeting block in schedule | Schedule, course | Owner through schedule | Day/time/location; manual entry | `ScheduleBuilder`, `/api/schedule-courses` |
| Flag/report | User report of content | Reporter, content item | Content school for admin review | `content_type`, `content_id`, `reason`, `status`; one pending report per reporter/content | `FlagButton`, `/api/flags`, admin flags |
| Admin role/permission | Global or campus administration | User, university | Global or assigned campus | `users.role='admin'`, `campus_admins`, suspension requests/appeals, audit log | `lib/server-auth.ts`, `lib/admin-context.ts`, admin pages/APIs |

## 7. Current Core User Flows

### A. New Verified Student
- Entry: `/` campus picker or `/auth/login?school=<domain>`.
- Login: `app/auth/login/page.tsx` sends Supabase OTP, verifies the code, then calls `/api/auth/setup`.
- Setup: setup route maps email domain to active university, upserts `users`, and may require handle creation through `/api/profile/handle`.
- First destination: login currently redirects to `/{school}/boards`; callback routes often normalize legacy next paths to `/{school}/...`.
- What they see first: school board/feed or school dashboard depending path.
- Friction/missing pieces: no rich onboarding explaining anonymity, trust, or how to contribute useful advisor/course/lab information; handle setup is functional but not deeply contextual.

### B. Student Looking Up an Advisor
- Browse/search flow: `/[school]/advisors` queries active advisors and aggregate review data, then `AdvisorSearch` filters by name/lab/research/department.
- Advisor detail flow: `/[school]/advisors/[id]` validates advisor belongs to URL school and renders advisor info, aggregate dimensions, review form, and active reviews.
- Review submission flow: `AdvisorReviewForm` -> `/api/reviews`; API checks auth, suspension, advisor school, uniqueness, then inserts.
- Displayed ratings/reviews: aggregate ratings from `advisor_aggregates`; individual active review text appears on detail page; flag buttons appear per review.
- Files/routes involved: advisor pages, `AdvisorSearch`, `AdvisorReviewForm`, `/api/reviews`, `FlagButton`, `advisor_aggregates`.

### C. Student Looking Up a Course
- Browse/search flow: `/[school]/courses` loads school courses/departments, review stats, and discussion counts; `CourseSearch` filters by code/name/prefix.
- Course detail flow: `/[school]/courses/[id]` validates course school and shows details with reviews/discussion tabs.
- Course review flow: `CourseReviewForm` -> `/api/course-reviews`; API checks auth, suspension, course school, then inserts.
- Course discussion flow: `CourseDiscussionTab` lists course-scoped posts; `NewCourseThreadForm` uses `/api/posts` with `course_id`; thread page uses `/api/comments`.
- Schedule integration: `/[school]/schedule` lets users add course catalog entries as manual meeting blocks, but course detail does not appear to have "add to schedule" yet.
- Files/routes involved: course pages, `CourseSearch`, `CourseReviewForm`, `CourseDiscussionTab`, `NewCourseThreadForm`, `/api/course-reviews`, `/api/posts`, schedule page/API.

### D. Student Using Boards
- Browse posts: `/[school]/boards` shows school feed; `/[school]/boards/[dept]` shows a department/topic board.
- Filter topics/departments: board pages use active departments and board categories from `departments`.
- Create post: `/[school]/boards/new` or board-specific form -> `/api/posts`; API validates auth, suspension, cooldown, and school ownership of dept/course.
- Comment: board/course thread pages use `CommentForm` -> `/api/comments`; API validates parent post school.
- Upvote: `UpvoteButton` -> `/api/votes`.
- Anonymous/display-name behavior: post-level `is_anonymous`; non-anonymous posts show handle/email-derived label and can expose messaging.
- Cooldown behavior: `/api/posts` enforces 5-minute cooldown per user, except global admins.
- Files/routes involved: board pages, board components, post/comment/vote APIs, `lib/admin-users.ts`.

### E. Student Using Messages / Schedule / Profile
- Messages: `/messages` lists conversations/unread counts; `/messages/compose` lists non-anonymous post authors from the viewer's school; `/messages/[userId]` displays the thread and marks incoming messages read. Feels partial because discovery is limited and send API needs careful recipient-scope review.
- Schedule: `/[school]/schedule` is a private manual weekly builder from seeded courses. Useful but partial because there is no course-detail integration, section import, conflict detection, or sharing.
- Profile: `/profile` is functional: users can edit handle, see own reviews/posts/comments/schedules, and request deletion for their own posts/comments.
- Files/routes involved: `app/messages/*`, `components/messages/*`, `app/api/messages/route.ts`, schedule files/APIs, profile page/components/API.

## 8. Existing Differentiated Features

- Verified university identity through university email OTP.
- School-scoped content and URL structure, including UMich/Northwestern/UIUC-style campus data.
- Advisor and lab-specific review surfaces rather than generic professor ratings only.
- Department pages that combine advisors, courses, and recent discussion.
- Course reviews plus course-specific discussion threads.
- Anonymous posting with moderation and admin review.
- Admin-managed campus data for departments, board topics, courses, advisors, and advisor affiliations.
- Private schedule builder tied to the local course catalog.
- Campus admin vs global admin moderation model.

## 9. Features That Currently Feel Generic

- Basic board feed with posts, comments, and votes.
- Direct messages without richer academic context.
- Profile activity page as a standard account dashboard.
- Manual schedule builder without catalog section data or course-planning intelligence.
- Basic search/filter within advisors, courses, and boards.
- Admin CRUD for campus data, aside from its school-scoped importance.

## 10. Empty, Weak, or Confusing Areas

| Area | Route/page | What the user currently sees | Why it feels weak | Files/components likely involved | Small improvement |
|---|---|---|---|---|---|
| Empty advisor pages | `/[school]/advisors/[id]` | Advisor metadata, review form, "no reviews" style state | It does not create urgency or show what to ask peers | advisor detail page, `AdvisorReviewForm` | Add request-review button/count and sample prompts for lab culture/funding/mentorship. |
| Advisor cards without reviews | `/[school]/advisors` | "Be first to review" and sparse lab/research text | Cold-start advisor discovery can feel like a directory | `AdvisorSearch`, advisor data/admin | Add research keywords, department affiliations, "students want reviews" count. |
| Empty course pages | `/[school]/courses/[id]` | Review form and no reviews/discussion | Course page does not yet help before reviews exist | course detail, `CourseReviewForm`, `CourseDiscussionTab` | Add Q&A prompts, common decision questions, request-review count. |
| Empty department pages | `/[school]/departments/[dept]` | Advisor/course lists plus possibly no posts/reviews | The "department survival" promise is not explicit enough | department detail page, board pages | Add survival guide sections: qualifying exams, funding, first-year tips, labs, workload. |
| Empty boards | `/[school]/boards`, `/[school]/boards/[dept]` | Empty feed/state and post CTA | Generic prompt does not tell students what valuable post to write | board pages/components | Add department-specific prompt chips and starter discussion categories. |
| Dashboard/home | `/[school]` | Quick links, recent posts/reviews, departments | Useful but not yet a strong "what should I do now?" homepage | `app/[school]/page.tsx` | Add personalized contribution prompts and empty-state modules. |
| Anonymity/trust messaging | Login, boards, review forms | Some safety copy | Users may not know what is anonymous, what admins can see, and why verification matters | login page, forms, board/detail pages | Add concise trust disclosures near first contribution moments. |
| Messages | `/messages/compose` | Only users who posted non-anonymously | It can look empty in cold start and lacks context | messages pages/components/API | Add "message from non-anonymous posts" explanation and tighter recipient school checks. |
| Schedule | `/[school]/schedule` | Manual builder with seeded courses | Useful tool, but disconnected from course detail and real sections | schedule component/API, course detail | Add "add to schedule" from course pages and basic conflict warnings. |

## 11. Product Direction Gaps

| Gap | Why it matters | User problem solved | Likely route/files/components touched | Likely data model/API changes | Difficulty | Cold-start impact |
|---|---|---|---|---|---|---|
| Department Home page upgrade | Department pages can become the beta anchor | Students need department-specific survival context before many reviews exist | `/[school]/departments/[dept]`, board/category components | Optional department content/prompts table, or derived sections from posts/reviews | Medium | High |
| Request Review button/count for advisors and courses | Creates demand signal without existing reviews | Lets students ask for missing advisor/course info | advisor/course detail and cards, dashboard | `review_requests` table keyed by target/user/school, notification/digest API | Medium | High |
| Advisor/course Q&A | More approachable than full reviews | Students can ask specific questions before enough reviewers exist | advisor detail, course discussion, post/comment APIs | Could reuse `posts` with target type, or add Q&A metadata | Medium | High |
| Better empty states | Cold-start pages need purpose | Converts blank pages into contribution flows | advisor/course/department/board pages | Usually none | Low | High |
| Rich advisor cards with research keywords | Makes directory useful before reviews | Students can identify relevant labs/advisors faster | `AdvisorSearch`, admin advisor manager/API | Possibly `research_keywords` or parse existing `research` | Low/Medium | Medium |
| Rich course cards with workload/usefulness/difficulty summaries | Helps course choice before opening detail | Students compare courses quickly | `CourseSearch`, course review aggregates | Aggregate view/materialized stats if not already enough | Medium | Medium |
| Department survival topics | Aligns product with grad student pain points | Organizes posts around admissions, quals, funding, labs, TA, housing | department page, board topics/admin | Seeded board categories or topic taxonomy | Low/Medium | High |
| Better onboarding explaining anonymity/trust | Users need confidence to contribute | Reduces fear around verified identity plus anonymity | login, first contribution forms, navbar/profile | Usually none | Low | Medium |
| Contribution prompts | Guides first posts/reviews | Students know what useful content looks like | dashboard, department/advisor/course pages | Optional prompt config | Low | High |
| Review-request notifications/digest | Turns passive demand into action | Reviewers know where help is needed | navbar/messages/dashboard/email later | notifications table or digest job | High | Medium/High |

## 12. Suggested Next Build Priorities

| Rank | Feature name | Why it matters | User problem solved | Likely files/routes/components involved | Likely DB/API changes | Difficulty | Helps cold start |
|---|---|---|---|---|---|---|---|
| 1 | Department page "alive" upgrade | Best single surface for a grad-student beta | Gives one department a useful home before content density | `/[school]/departments/[dept]`, board/category links, advisor/course snippets | Optional prompt/config data | Medium | Yes |
| 2 | Better empty states and contribution prompts | Every low-content page currently needs guidance | Turns blanks into actions | advisor/course/department/board pages and forms | None or prompt config | Low | Yes |
| 3 | Request Review for advisors/courses | Creates visible demand and reason to return | Students can request missing info | advisor/course cards/detail, dashboard | `review_requests`, API, counts | Medium | Yes |
| 4 | Advisor Q&A / "Ask about this lab" | Low-friction advisor-specific content | Students can ask targeted questions without writing reviews | advisor detail, post/comment model | Reuse posts or add target metadata | Medium | Yes |
| 5 | Course Q&A prompts and discussion surfacing | Makes courses useful before reviews | Students ask workload/fit questions | course detail, `CourseDiscussionTab`, dashboard | Reuse posts, maybe tags | Low/Medium | Yes |
| 6 | Rich advisor cards | Makes directory intrinsically useful | Faster advisor/lab discovery | `AdvisorSearch`, admin advisor form | Possibly research keywords field | Low/Medium | Yes |
| 7 | Rich course cards | Improves browse value | Faster course comparison | `CourseSearch`, course aggregates | Aggregate stats/view if needed | Medium | Yes |
| 8 | Trust/onboarding copy at contribution points | Builds confidence in verified anonymity | Reduces hesitation to post/review | login, review forms, post forms | None | Low | Yes |
| 9 | Message recipient scoping hardening | Closes privacy/scoping gap before expanding DMs | Prevents cross-school messaging by ID | `/api/messages`, message compose | None | Low | No |
| 10 | Schedule-course scoping hardening and add-to-schedule | Makes schedule safer and more useful | Prevents cross-school course blocks; links course detail to planning | `/api/schedule-courses`, `ScheduleBuilder`, course detail | Maybe none | Low/Medium | No |

## 13. Recommended Immediate Sprint

Sprint goal: Make one Michigan department page feel alive enough for a small grad-student beta.

| Item | Exact goal | Likely files/routes to touch | Expected user-facing outcome | Risk/caution |
|---|---|---|---|---|
| 1 | Upgrade `/umich/departments/[dept]` into a stronger department home | `app/[school]/departments/[dept]/page.tsx` | A student sees useful sections for advisors, courses, recent discussion, and survival prompts | Keep all queries scoped to URL school's `university.id`; do not blend departments with board categories accidentally. |
| 2 | Add department survival prompt chips | department detail, board new form/linking | Users can start posts like quals, funding, TA load, lab rotations, housing | Reuse existing board post flow and preserve anonymous toggle. |
| 3 | Improve empty advisor/course sections | department detail, advisor/course card snippets | Empty content still suggests meaningful next action | Avoid implying reviews exist when counts are zero. |
| 4 | Add request-review UI for advisors/courses as a small demand signal | advisor/course cards/detail pages, likely new API/table | Users can say "I want a review" without writing one | Must prevent duplicate requests per user/target and keep school scoping. |
| 5 | Surface course discussion starters on department page | department detail, course discussion links | Department page links to course-specific questions even with few reviews | Ensure course discussions use `board_type='course'` and `course_id`. |
| 6 | Add trust/anonymity microcopy near first contribution CTAs | review forms, post form, department page | Users understand verified login vs anonymous display | Do not expose private identity or overpromise anonymity beyond current implementation. |
| 7 | Validate core flows locally | `npm run lint`, `npm run build`, targeted manual pages | Basic regressions caught before handoff/deploy | Build may touch `.next`; ignore generated churn unless user asks. |

## 14. What Future AI Agents Should Be Careful Not To Break

| Invariant | Where it appears enforced | Caution |
|---|---|---|
| University email OTP login | `app/auth/login/page.tsx`, `app/auth/callback/route.ts`, `app/api/auth/setup/route.ts`, `lib/auth.ts` | Keep domain checks and active university lookup aligned. |
| School-scoped content visibility | `app/[school]/*` pages, `lib/school.ts`, `lib/school-slugs.ts`, API routes, `016_school_scoping_integrity.sql` | Server mutations use admin client, so route checks matter. |
| Anonymous posting/review behavior | `posts.is_anonymous`, board/course pages, `lib/admin-users.ts`, review text fields | Do not expose author identity for anonymous posts or public reviewer IDs. |
| One review per user per advisor | DB unique index on advisor reviews; `/api/reviews` handles duplicate | Keep duplicate handling user-friendly. |
| Course review uniqueness | DB unique index on `(course_id, reviewer_id, semester)` | Confirm whether product wants one per course or one per course per semester before changing. |
| Advisor/course review submission | `AdvisorReviewForm`, `CourseReviewForm`, `/api/reviews`, `/api/course-reviews` | Preserve school checks and suspended-user blocks. |
| Post cooldown | `/api/posts/route.ts` | Non-global-admin users are limited to 5 minutes between posts. |
| Flagging/reporting | `FlagButton`, `/api/flags`, `/api/admin/flags`, flags unique index | Preserve one pending flag per reporter/content and undo behavior. |
| Admin flag review | `/[school]/admin/flags`, `/api/admin/flags`, `canAdminUniversity` | Verify content-school checks when adding content types, especially course reviews. |
| Admin user suspension | `/api/admin/users`, `/api/admin/suspension-requests`, `/api/admin/appeals`, `SuspensionBanner` | Campus admins request; global admins approve; banned users blocked from mutations. |
| Campus admin vs global admin permissions | `getAdminViewer`, `canAdminUniversity`, `requireAdminUniversity`, `campus_admins` table | Do not give campus admins global capabilities. |
| School slug canonicalization | `lib/school-slugs.ts`, `middleware.ts` | Reserved top-level segments prevent routes like `/advisors` becoming fake schools. |
| Department/course/advisor school integrity | `016_school_scoping_integrity.sql` triggers | When adding tables, mirror these constraints where possible. |

## 15. Final Handoff Summary

- What the app already does well: it has a real school-scoped Next.js/Supabase app with verified login, advisor/course directories, review submission, department pages, anonymous boards, course discussions, private schedules, profile activity, DMs, and a meaningful moderation/admin model.
- What the app is trying to become: a verified graduate-student knowledge platform for advisor/lab truth, course advice, department survival, and anonymous but moderated campus discussion.
- Biggest current product problem: cold-start pages can feel sparse or generic, especially advisor/course/department pages with no reviews or posts.
- Biggest current technical risk: server mutations often use a service-role admin client, so every write route must explicitly preserve auth, school scoping, anonymity, and role checks.
- First feature the next AI agent should build: make one `/umich/departments/[dept]` page feel alive with survival prompts, stronger empty states, advisor/course contribution CTAs, and links into existing board/course discussion flows.
- Files/routes the next AI agent should inspect first: `AGENTS.md`, this file, `app/[school]/departments/[dept]/page.tsx`, `app/[school]/advisors/*`, `app/[school]/courses/*`, `app/[school]/boards/*`, `app/api/posts/route.ts`, `app/api/reviews/route.ts`, `app/api/course-reviews/route.ts`, `lib/server-auth.ts`, `lib/school-slugs.ts`, `supabase/migrations`.
- Things the next AI agent should avoid wasting time on: Vercel/deployment status unless explicitly requested, broad repo re-audits, generated `.next` files, old root routes unless fixing redirects/legacy behavior, and admin/security internals unless the task touches permissions, moderation, authentication, or school scoping.

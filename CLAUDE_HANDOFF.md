# jamshiman Product + Technical Handoff for Claude

This document is for a future AI agent helping decide what features to build next in **jamshiman**.

The key framing is:

- jamshiman is **inspired by Everytime**, the Korean college community app
- it is **not** meant to be a direct clone
- the goal is to adapt the idea for **U.S. college students**
- the current alpha is **UMich-only** and **grad-student-first**, but the larger opportunity is broader U.S. campus life

This handoff focuses on the product as it exists today and what should be considered next.

---

## 1. Current product concept

jamshiman is currently a **campus-scoped, verified, semi-anonymous student app** built around a few high-trust student use cases:

- advisor reviews
- course reviews
- department discussion boards
- a private schedule builder

### What kind of app it is

It is a **campus community + student utility app**. Right now it feels like a hybrid of:

- a verified review product for grad students
- a lightweight anonymous department forum
- a private academic planning tool

### Who the target users are

Current target users:

- University of Michigan students
- especially graduate students
- especially students who need candid information about advisors, courses, and department culture

Likely future target users:

- broader U.S. college students
- eventually undergrads as well as grad students
- students looking for campus-specific community, information, social discovery, and practical student tools

### What problem it currently solves

Right now the app mostly solves:

- “How do I get honest information about advisors and courses that official university channels won’t tell me?”
- “Where can I ask department-specific questions without using a random public forum?”
- “How can I keep a simple private class schedule in the same product?”

### What problem it could solve in the future

The larger opportunity is to become a **campus operating layer** for U.S. students:

- trusted school-specific discussion
- course and class communities
- social discovery around classes and student life
- student tools like schedules, study groups, campus info, clubs, housing, and events

### How it differs from a generic social media app

It is not trying to be a broad, interest-based social network.

The distinguishing product ideas are:

- **campus identity** rather than generic internet identity
- **school verification** rather than open anonymous signup
- **structured student objects** like advisors, courses, departments, and schedules
- **usefulness** over pure entertainment
- **school-context trust** rather than global content discovery

The long-term strategic advantage is not “be another feed app.” It is “be the place students open because the information is locally relevant, verified, and practically useful.”

---

## 2. Current implemented features

Below is the current product surface as implemented in the repo.

### Feature: Landing page and top-level navigation

- What the user can do:
  - understand the current value proposition
  - jump into advisors, courses, boards, schedule, or login
- Relevant files:
  - `app/page.tsx`
  - `components/Navbar.tsx`
- Product maturity:
  - **MVP-level but fairly intentional**
  - clear direction, but not yet a personalized or high-retention homepage

### Feature: UMich-only magic-link login

- What the user can do:
  - request a sign-in link with a school email
  - complete login through Supabase magic link auth
  - be auto-created in the app’s `users` table on first login
- Relevant files:
  - `app/auth/login/page.tsx`
  - `app/auth/callback/route.ts`
  - `lib/auth.ts`
  - `lib/server-auth.ts`
- Product maturity:
  - **MVP-level**
  - functional and real, but not yet a full onboarding experience

### Feature: Advisor directory and advisor detail pages

- What the user can do:
  - browse advisors
  - search advisor names
  - view advisor title, department, lab, research areas
  - see aggregate ratings and reviews when enough submissions exist
- Relevant files:
  - `app/advisors/page.tsx`
  - `app/advisors/AdvisorsList.tsx`
  - `app/advisors/[id]/page.tsx`
  - `components/ui/StarRating.tsx`
- Product maturity:
  - **strong MVP**
  - this is one of the clearest and most developed product surfaces in the app

### Feature: Advisor review submission

- What the user can do:
  - rate an advisor across structured categories
  - add context like degree type, current/former status, years in lab
  - submit a written review
  - see a confirmation state after submission
- Relevant files:
  - `components/forms/AdvisorReviewForm.tsx`
  - `app/api/reviews/route.ts`
  - `types/database.ts`
- Product maturity:
  - **strong MVP**
  - useful, structured, and focused
  - no longer includes AI rewriting; submission is direct

### Feature: Advisor review privacy gate

- What the user can do:
  - public readers only see advisor reviews after at least 3 active reviews exist
  - before that, they see a privacy-gate explanation instead of the actual reviews
- Relevant files:
  - `app/advisors/[id]/page.tsx`
  - `types/database.ts`
  - `supabase/migrations/001_initial_schema.sql`
- Product maturity:
  - **good MVP**
  - product-meaningful and aligned with sensitive grad-student use cases

### Feature: Course directory and course detail pages

- What the user can do:
  - browse courses
  - search by code or name
  - open a course page
  - see review counts and aggregate snapshot once enough reviews exist
- Relevant files:
  - `app/courses/page.tsx`
  - `app/courses/[id]/page.tsx`
- Product maturity:
  - **MVP-level**
  - functional, but still depends heavily on seeded catalog data and lacks surrounding community/discovery layers

### Feature: Course review submission

- What the user can do:
  - rate courses across structured fields
  - submit semester-specific course reviews
  - read reviews once 3+ exist
- Relevant files:
  - `components/forms/CourseReviewForm.tsx`
  - `app/api/course-reviews/route.ts`
- Product maturity:
  - **MVP-level**
  - useful, but less differentiated than advisor reviews today

### Feature: Department boards

- What the user can do:
  - browse active departments
  - open a department board
  - read posts without logging in
  - create threads if logged in
  - choose anonymous or non-anonymous posting
- Relevant files:
  - `app/boards/page.tsx`
  - `app/boards/[dept]/page.tsx`
  - `components/forms/BoardPostForm.tsx`
  - `app/api/posts/route.ts`
- Product maturity:
  - **MVP-level**
  - the structure exists, but the system still feels like a basic forum rather than a strong campus community product

### Feature: Board post detail and comments

- What the user can do:
  - open a thread
  - read comments
  - add comments when logged in
  - choose anonymous or non-anonymous commenting
- Relevant files:
  - `app/boards/[dept]/[postId]/page.tsx`
  - `components/forms/CommentForm.tsx`
  - `app/api/comments/route.ts`
  - `lib/admin-users.ts`
- Product maturity:
  - **MVP-level**
  - enough to support early conversations, but lacks engagement loops like notifications, votes, and deeper discovery

### Feature: Reporting / flagging content

- What the user can do:
  - report advisor reviews
  - report course reviews
  - report posts
  - report comments
  - choose a reason and optional note
- Relevant files:
  - `components/FlagButton.tsx`
  - `app/api/flags/route.ts`
  - `lib/content.ts`
- Product maturity:
  - **MVP-level**
  - important trust/safety foundation, but still basic

### Feature: Private schedule builder

- What the user can do:
  - create multiple schedules
  - assign a name and semester
  - add manual meeting blocks tied to course records
  - edit or delete blocks
  - see a weekly grid
- Relevant files:
  - `app/schedule/page.tsx`
  - `components/schedule/ScheduleBuilder.tsx`
  - `app/api/schedules/route.ts`
  - `app/api/schedule-courses/route.ts`
- Product maturity:
  - **MVP-level**
  - more useful than placeholder, but still clearly a first version

### Feature: Private profile page

- What the user can do:
  - view their own submitted advisor reviews
  - view their own course reviews
  - view their own board posts and comments
  - view their saved schedules
- Relevant files:
  - `app/profile/page.tsx`
- Product maturity:
  - **placeholder-to-MVP**
  - real data is shown, but the page is mostly read-only and not yet a full account/settings surface

### Feature: Admin dashboard and moderation tools

- What the user can do:
  - view pending flag count
  - review and dismiss/remove flagged content
  - manage advisor records
  - promote or demote admin access for signed-in users
- Relevant files:
  - `app/admin/page.tsx`
  - `app/admin/flags/page.tsx`
  - `app/admin/flags/FlagActions.tsx`
  - `app/admin/advisors/page.tsx`
  - `components/admin/AdvisorAdminManager.tsx`
  - `app/admin/access/page.tsx`
  - `components/admin/AccessManager.tsx`
  - `app/api/admin/advisors/route.ts`
  - `app/api/admin/access/route.ts`
  - `app/api/admin/flags/route.ts`
- Product maturity:
  - **good internal MVP**
  - enough to operate an early alpha, not a full moderation/control plane

### Feature: Local developer bypass auth

- What the user can do:
  - local developers can sign in as a dev admin without email
- Relevant files:
  - `app/api/dev-login/route.ts`
  - `app/api/dev-admin/flag-action/route.ts`
  - `lib/dev-bypass.ts`
- Product maturity:
  - **internal tooling only**
  - not a product feature, but useful context for future development

---

## 3. Current user flows

### Flow: Open the app for the first time

Current flow:

1. User lands on `/`
2. Sees the grad-first UMich framing
3. Can click into advisors, courses, boards, schedule, or login

What feels missing:

- no personalized onboarding
- no “why should I return tomorrow?” loop
- no campus activity feed
- no explanation of how content gets seeded or why a section may look empty

### Flow: Sign up / log in

Current flow:

1. User visits `/auth/login`
2. Enters a school email
3. Receives a Supabase magic link
4. Callback creates or updates a `users` row
5. User is redirected into the app

What feels missing:

- no first-run setup for department, degree type, interests, or campus context
- no onboarding after login
- no explanation of anonymity model by surface
- no persistent “home” destination tailored to the user

### Flow: Browse advisor content

Current flow:

1. User visits `/advisors`
2. Searches or browses advisor cards
3. Opens `/advisors/[id]`
4. Sees summary info and either:
   - a review gate if fewer than 3 reviews exist
   - or public reviews and aggregate scores if the threshold is met

What feels missing:

- no saved advisors / compare later behavior
- no filters beyond simple search
- no “related advisors” or department context
- no stronger social layer around advisor exploration

### Flow: Submit an advisor review

Current flow:

1. Logged-in user opens an advisor page
2. Fills in structured ratings and text
3. Submits directly
4. Sees confirmation state

What feels missing:

- no edit/delete flow for the author
- no richer “why your review matters” onboarding
- no contribution history or trust progression
- no review draft or save-for-later behavior

### Flow: Browse courses

Current flow:

1. User visits `/courses`
2. Searches course code or title
3. Opens `/courses/[id]`
4. Sees course detail, review count, and the same 3-review gate behavior

What feels missing:

- no course-specific discussion
- no course browsing by department/semester/instructor
- no recommendation or discovery layer
- no ability to use course pages as an active student community

### Flow: Submit a course review

Current flow:

1. Logged-in user opens a course page
2. Rates the course
3. Adds semester + text review
4. Submits it

What feels missing:

- no course-to-course comparison
- no instructor-specific dimension
- no ties to schedules, classmates, Q&A, or study groups

### Flow: Browse boards and create a thread

Current flow:

1. User visits `/boards`
2. Selects a department board
3. Reads threads publicly
4. If logged in, creates a thread with anonymous toggle

What feels missing:

- no feed of “hot” or “recent across campus”
- no board search
- no course-specific boards
- no upvotes, subscriptions, bookmarks, or notifications
- no clear sense of what kinds of posts are most valuable on the platform

### Flow: Open a post and comment

Current flow:

1. User opens `/boards/[dept]/[postId]`
2. Reads the post and comments
3. If logged in, adds a comment
4. Can report content

What feels missing:

- no reply notifications
- no nested replies
- no lightweight reactions/upvotes
- no “your department is talking about…” discovery loop

### Flow: Build a schedule

Current flow:

1. Logged-in user opens `/schedule`
2. Creates a schedule
3. Adds manual blocks from the course catalog
4. Edits or deletes blocks
5. Views a weekly timetable grid

What feels missing:

- no conflict detection
- no section/instructor import
- no shareable schedule
- no schedule-to-social bridge
- no obvious reason this should live inside the same product yet, beyond future potential

### Flow: Check profile

Current flow:

1. Logged-in user visits `/profile`
2. Sees their own reviews, board activity, and schedules

What feels missing:

- no settings
- no delete/edit controls
- no identity or preference setup
- no saved content, follows, alerts, or engagement history

### Flow: Admin operation

Current flow:

1. Admin visits `/admin`
2. Can inspect flags
3. Can manage advisors
4. Can manage admin access

What feels missing:

- no broader moderation analytics
- no user suspension tooling beyond `is_banned` existing in data
- no course catalog management UI
- no department/university management UI

---

## 4. Product gaps

If this app is meant to become a strong U.S. college community platform, the biggest product gaps are below.

### Campus identity and verification

Current state:

- school email verification exists
- app is scoped to allowed school domains
- boards allow anonymous or semianonymous posting

Gap:

- no deeper identity layer beyond “has a school email”
- no onboarding around department, year, dorm, program, clubs, or interests
- no clear product stance yet on when identity should be anonymous vs pseudonymous vs visible

### Course-specific communities

Current state:

- courses exist
- reviews exist
- schedules can reference courses

Gap:

- no live discussion tied to specific courses
- no class Q&A, study group, section-level context, or classmate discovery

This is a major gap if the product wants to feel truly Everytime-inspired in a U.S. context.

### Anonymous posting model

Current state:

- advisor/course reviews are anonymous
- boards let the user choose anonymous or email-prefix display

Gap:

- no unified product philosophy for identity by context
- no persistent pseudonym model
- no trust/reputation model for anonymous users

### Moderation and trust/safety

Current state:

- reporting exists
- admin moderation exists

Gap:

- no scalable moderation system yet
- no user-level moderation workflow
- no content policies surfaced to users
- no protection design for growth in an anonymous campus environment

### Clubs and events

Current state:

- not modeled yet

Gap:

- no student life layer beyond departments, advisors, and courses
- no reasons for clubs, orgs, or event-seeking students to use the app

### Marketplace

Current state:

- not modeled

Gap:

- no textbook, sublease, furniture, ride-share, or campus commerce features
- no liquidity strategy or trust model for those use cases

### Housing

Current state:

- not modeled

Gap:

- no roommate, sublease, housing Q&A, or neighborhood knowledge layer

### Study groups / social discovery

Current state:

- no social graph
- no classmate discovery
- no opt-in matching

Gap:

- no bridge from utilities like schedules/courses into actual student connection

This is likely one of the most powerful differentiators if done carefully.

### Professor / course / instructor depth

Current state:

- advisor reviews exist
- course reviews exist

Gap:

- no instructor-specific review layer outside course reviews
- no way to connect course experience to specific sections or professors

### Notifications

Current state:

- none

Gap:

- no return loop after posting or commenting
- no inbox
- no feeling of an active campus conversation

### Search and discovery

Current state:

- advisor search exists
- course search exists
- board directory exists

Gap:

- no unified search
- no “discover what matters for me”
- no campus homepage or personalized feed

### Student utility features

Current state:

- schedule builder exists

Gap:

- no other strong utility tools yet
- no planner, deadlines, events, scholarships, TA/RA/funding resources, or student workflows

### Onboarding and retention

Current state:

- sign in works
- sections exist

Gap:

- no tailored first-run path
- no obvious habit loop
- no notification loop
- no content personalization

Right now the app is more useful as a **destination tool** than a **daily campus habit**.

---

## 5. Feature ideas Claude should consider

Below are possible next directions grounded in the current product.

### Immediate MVP features

#### 1. Course-specific discussion threads

- Why U.S. college students would care:
  - classes are one of the most consistent anchors of student life
  - students want Q&A, workload context, survival advice, group-project discussion, and peer tips
- Connection to the Everytime-inspired concept:
  - this is one of the clearest U.S. equivalents of Everytime’s class/community behavior
- Expected user value:
  - turns course pages from static review pages into active communities
- Rough implementation difficulty:
  - **Medium to High**
- Likely files/areas touched:
  - `app/courses/[id]/page.tsx`
  - `app/boards/*`
  - `app/api/posts/route.ts`
  - `app/api/comments/route.ts`
  - `types/database.ts`
  - likely a new migration to relate posts to courses or introduce board types
- Build timing:
  - **Build now**

#### 2. Personalized onboarding + first-run profile setup

- Why U.S. college students would care:
  - they want the app to feel relevant immediately
  - department, degree type, and current academic context matter a lot
- Connection to the Everytime-inspired concept:
  - campus apps work better when they immediately drop users into the right local context
- Expected user value:
  - stronger activation and better content relevance
- Rough implementation difficulty:
  - **Medium**
- Likely files/areas touched:
  - `app/auth/callback/route.ts`
  - `app/profile/page.tsx`
  - `types/database.ts`
  - `supabase/migrations/001_initial_schema.sql` only if more fields are needed
  - possibly a new onboarding route/page
- Build timing:
  - **Build now**

#### 3. Campus home / discovery feed

- Why U.S. college students would care:
  - they need a reason to open the app even when they are not actively searching for one advisor or course
- Connection to the Everytime-inspired concept:
  - Everytime-like products feel like campus hubs, not just utilities
- Expected user value:
  - improves retention and cross-feature discovery
- Rough implementation difficulty:
  - **Medium**
- Likely files/areas touched:
  - `app/page.tsx` or a new logged-in home route
  - queries across advisors, courses, posts
  - perhaps `users.dept_id` and future preference fields
- Build timing:
  - **Build now**

#### 4. Notifications / reply inbox

- Why U.S. college students would care:
  - if someone replies to a thread or comment, they expect to know
- Connection to the Everytime-inspired concept:
  - active campus communities need lightweight return loops
- Expected user value:
  - significantly better engagement and repeat use
- Rough implementation difficulty:
  - **Medium**
- Likely files/areas touched:
  - comment/post APIs
  - navbar/profile
  - likely a new notifications table and inbox page
- Build timing:
  - **Build now or immediately after the home feed**

#### 5. Stronger board taxonomy and posting guidance

- Why U.S. college students would care:
  - early communities often feel empty or random without clear content norms
- Connection to the Everytime-inspired concept:
  - school-specific communities usually work best with recognizable sub-contexts
- Expected user value:
  - clearer posting behavior, better content quality, less randomness
- Rough implementation difficulty:
  - **Low to Medium**
- Likely files/areas touched:
  - `app/boards/page.tsx`
  - `app/boards/[dept]/page.tsx`
  - `components/forms/BoardPostForm.tsx`
  - maybe new post categories in schema later
- Build timing:
  - **Build now**

### Differentiating features

#### 6. Schedule-linked classmate or study-group discovery

- Why U.S. college students would care:
  - students want to find people in the same classes, project-heavy courses, or academic situations
- Connection to the Everytime-inspired concept:
  - this turns the schedule from a private planner into a social graph rooted in student reality
- Expected user value:
  - strong utility + social discovery hybrid
- Rough implementation difficulty:
  - **High**
- Likely files/areas touched:
  - `app/schedule/page.tsx`
  - `components/schedule/ScheduleBuilder.tsx`
  - `types/database.ts`
  - likely new tables for opt-in sharing/matching
- Build timing:
  - **Later, but strategically important**

#### 7. Campus utility hub for department-specific resources

- Why U.S. college students would care:
  - critical information is fragmented across email, PDFs, random docs, and institutional websites
- Connection to the Everytime-inspired concept:
  - makes the app more like a campus operating system than a simple forum
- Expected user value:
  - durable usefulness and trust
- Rough implementation difficulty:
  - **Medium**
- Likely files/areas touched:
  - new pages and tables
  - possibly `app/page.tsx`, `app/boards/*`, `types/database.ts`
- Build timing:
  - **Soon, once core community loops are stronger**

#### 8. Opt-in semianonymous campus identity

- Why U.S. college students would care:
  - many want some continuity of identity without exposing real names
- Connection to the Everytime-inspired concept:
  - closer to campus-native behavior than either full anonymity or full real-name social
- Expected user value:
  - better trust, continuity, and social memory
- Rough implementation difficulty:
  - **Medium**
- Likely files/areas touched:
  - `users` model
  - `lib/admin-users.ts`
  - boards/profile UI
  - maybe onboarding and posting flows
- Build timing:
  - **Consider soon, but only after deciding the identity philosophy clearly**

### Later-stage features

#### 9. Clubs and events

- Why U.S. college students would care:
  - student life is much broader than academics
- Connection to the Everytime-inspired concept:
  - expands campus relevance
- Expected user value:
  - broader retention and social usefulness
- Rough implementation difficulty:
  - **High**
- Likely files/areas touched:
  - new domain model and pages
- Build timing:
  - **Later**

#### 10. Housing and roommate tools

- Why U.S. college students would care:
  - high pain point, especially around subleases and off-campus housing
- Connection to the Everytime-inspired concept:
  - strong campus utility surface
- Expected user value:
  - high practical value
- Rough implementation difficulty:
  - **High**
- Likely files/areas touched:
  - entirely new schema, moderation model, and listing flow
- Build timing:
  - **Later**

#### 11. Marketplace

- Why U.S. college students would care:
  - buying/selling textbooks, furniture, tickets, and small campus goods is common
- Connection to the Everytime-inspired concept:
  - common student super-app behavior
- Expected user value:
  - useful but operationally heavy
- Rough implementation difficulty:
  - **High**
- Likely files/areas touched:
  - new schema, listings, chat/coordination, moderation
- Build timing:
  - **Avoid for now**

#### 12. Multi-school expansion

- Why U.S. college students would care:
  - expands market size
- Connection to the Everytime-inspired concept:
  - school-specific tenancy is central to the concept
- Expected user value:
  - business growth, not immediate single-campus product quality
- Rough implementation difficulty:
  - **Medium to High**
- Likely files/areas touched:
  - `universities`, `departments`, auth config, onboarding, admin tooling
- Build timing:
  - **Later**

---

## 6. Recommended next development direction

The top 3 features Claude should seriously consider are below.

### 1. Course-specific discussions / class Q&A

- Why it is high-priority:
  - courses are a daily-use anchor
  - the app already has course pages and reviews, but they are still mostly static
  - this is one of the clearest bridges from “review database” to “live campus community”
- What user problem it solves:
  - students need real-time class context, not just retrospective reviews
- Minimal version to build first:
  - allow each course page to have threads or a discussion tab
  - start with simple posts/comments attached to a course
  - preserve anonymous or semianonymous posting choices
- What should not be overbuilt yet:
  - do not build a full LMS clone
  - do not build advanced tagging, votes, reactions, and nested thread systems all at once

### 2. Personalized onboarding + a logged-in campus home

- Why it is high-priority:
  - right now the app has sections, but not a cohesive experience
  - a user can sign in and still not feel “this is my campus space”
- What user problem it solves:
  - helps students quickly find relevant advisors, courses, boards, and activity
- Minimal version to build first:
  - collect department and degree type on first run if missing
  - redirect logged-in users to a simple home screen that shows:
    - recent department threads
    - recent course activity
    - advisor/course shortcuts
- What should not be overbuilt yet:
  - do not build an algorithmic feed
  - do not overcomplicate personalization before enough content exists

### 3. Notifications / inbox for replies

- Why it is high-priority:
  - current community actions have weak return loops
  - users can post and comment, but there is no built-in reason to come back
- What user problem it solves:
  - students want to know when someone responds or when a conversation advances
- Minimal version to build first:
  - create a simple in-app inbox
  - support notifications for:
    - replies to your post
    - replies after your comment in a thread
- What should not be overbuilt yet:
  - do not start with push notifications, email digests, or real-time websockets
  - do not design a huge notification preference system yet

---

## 7. Product risks and strategic questions

Claude should think carefully about these questions before recommending the next roadmap.

- Should the product remain **UMich-only and grad-first** for a while, or expand quickly toward general college use?
- Is **school email verification** enough, or should the long-term product aim for stronger school-specific verification?
- For each surface, should identity be:
  - fully anonymous
  - persistent pseudonymous
  - optional semianonymous
  - or real-name?
- Should the primary community units be:
  - school
  - department
  - course
  - dorm
  - club
  - or some combination?
- What is the best daily habit loop so the app becomes more than a review tool?
- What makes this meaningfully better than:
  - Reddit
  - Discord
  - GroupMe
  - Sidechat
  - campus mailing lists
  - or university forums?
- How should moderation work if anonymous boards scale?
- What content creates the highest legal or reputational risk?
  - advisor reviews
  - professor/course claims
  - housing posts
  - marketplace activity
- Should public reading remain open, or should more content require school login?
- How should the app handle low-volume campuses or departments where anonymity is fragile?
- Is the schedule builder meant to remain a private utility, or eventually become a social/discovery graph?
- How will the product seed enough initial content to avoid empty-state churn?

---

## 8. Technical constraints for future features

Claude should know the following before proposing product directions.

### Framework and stack

- Next.js 14 App Router
- React 18
- Tailwind CSS
- Supabase for auth + database + RLS
- Vercel as intended hosting target

### Current data model

The app already has a real schema for:

- universities
- departments
- users
- advisors
- advisor_reviews
- courses
- course_reviews
- posts
- comments
- schedules
- schedule_courses
- flags
- audit_log

There is also an `advisor_aggregates` view for advisor review summaries.

### Auth status

Auth exists and is real:

- Supabase magic-link sign-in
- allowed-school-domain gating in `lib/auth.ts`
- profile creation in `app/auth/callback/route.ts`
- admin role gating through `users.role`

There is also a **local dev bypass** for development, but it should not drive product planning.

### Backend/database status

- real Supabase backend
- real database schema
- real server routes
- no mock-only product shell

### Whether the app uses mock data

Mostly no.

The app relies on real Supabase data, but some sections will feel empty unless seeded:

- advisors must be seeded
- courses must be seeded
- departments are seeded minimally

### Important technical/product constraints

- advisor/course reviews are currently **direct submission**, not AI-rewritten
- the **3-review privacy gate** exists in the UI layer for advisor and course reviews
- boards are currently tied to **departments**, not courses or topics
- non-anonymous board identity currently uses **email prefix display**, not a durable pseudonym system
- schedules are **private** and based on **manual time entry**
- there is **no notification model**
- there are **no marketplace/housing/events/club tables yet**

### Important files Claude should inspect before suggesting or adding features

- `CLAUDE_HANDOFF.md`
- `README.md`
- `types/database.ts`
- `supabase/migrations/001_initial_schema.sql`
- `lib/auth.ts`
- `lib/server-auth.ts`
- `app/page.tsx`
- `app/auth/login/page.tsx`
- `app/auth/callback/route.ts`
- `app/advisors/*`
- `app/courses/*`
- `app/boards/*`
- `app/schedule/page.tsx`
- `app/profile/page.tsx`
- `app/admin/*`
- `app/api/*`

---

## 9. Suggested prompt for Claude

Use the prompt below for Claude:

```markdown
You are helping shape the next product direction for jamshiman.

Please read the handoff carefully and think like a product designer, startup founder, and campus-product strategist first. Do not jump into coding.

Context:
- jamshiman is a U.S. college app inspired by Everytime, but it should not be a direct clone
- the current alpha is UMich-only and grad-student-first
- the app already has advisor reviews, course reviews, department boards, a private schedule builder, profile pages, and a small admin system
- the bigger opportunity is a campus-specific community + student utility product for U.S. students

Please do the following:

1. Propose 3 possible next product directions
   - each direction should be coherent, not just a single isolated feature
   - explain the user problem, why students would care, and what kind of habit or value loop it could create

2. Recommend 1 direction
   - explain why it is the strongest next move right now
   - explain why the other directions are less urgent

3. Define the first small implementation step
   - keep it intentionally small
   - do not overbuild
   - focus on the smallest meaningful product increment

4. Consider strategy questions like:
   - how campus identity should work
   - what should be anonymous vs semianonymous
   - what makes this better than Reddit/Discord/GroupMe/Sidechat
   - what could create moderation, privacy, or legal risk

Please optimize for product clarity and startup judgment, not code output.
```

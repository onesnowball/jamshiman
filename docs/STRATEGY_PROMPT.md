# Strategy Analysis Prompt — jamshiman

Paste the following into Claude (use claude.ai with extended thinking / o1-level reasoning enabled for best results):

---

## PROMPT

You are advising the founder of **jamshiman** — a verified graduate student platform that is live and has real users at three universities (University of Michigan, Northwestern, and UIUC). I need you to reason carefully through the following questions and give concrete, prioritized recommendations. Think step by step.

---

### Context

**What the product is:**
A web platform for graduate students, verified exclusively via `.edu` email (no passwords — OTP only). The platform offers:
1. Anonymous department boards (career advice, housing, research, mental health, marketplace)
2. Blind advisor reviews — ratings across mentorship, funding reliability, work-life balance, communication, career support — only shown publicly after 3+ reviews exist for that advisor
3. Course reviews and per-course discussion boards
4. Direct anonymous messaging between verified students
5. Schedule builder

**Tech stack:** Next.js 14 (App Router), Supabase (Postgres + Auth), Vercel, TypeScript, Tailwind.

**Business model:** Non-profit. No ads, no paid tiers. Goal is to be a trusted, student-controlled information layer across graduate programs in the US.

**Current state:**
- Fully functional MVP is live at jamshiman.com
- 3 universities onboarded: UMich, Northwestern, UIUC
- All course and advisor data is added manually by campus admins through an admin dashboard
- No marketing has been done yet — growth is purely organic word-of-mouth within existing user networks
- 1 developer (founder) building everything
- Codebase is clean, modular Next.js App Router with typed Supabase access, numbered database migrations, Vercel deployment

**Unique insight:** Graduate students have almost no trusted, peer-driven resource for the most important decisions they make — choosing an advisor, picking courses, navigating university bureaucracy. This product fills that gap. The anonymity + .edu verification combination is the core trust mechanism.

---

### Questions to reason through

**1. Scalability — should we care about it right now?**

The current architecture is a standard Next.js + Supabase stack on Vercel. There is no caching layer, no background job queue, no CDN for user content, and no database read replicas. Assess:
- At what user volume does this architecture start to strain, given the query patterns described above?
- What are the first two or three things that would break under load, and at what rough threshold?
- Is there anything in the current design that would be expensive to fix later if ignored now versus cheap to add now?
- Should the founder spend any engineering time on scalability before hitting meaningful user traction, or is this premature optimization?

**2. Marketing and growth — non-profit, no budget**

The product requires critical mass to be useful (a board with 3 users isn't helpful; an advisor with 2 reviews isn't shown). Assess:
- What is the single most effective zero-cost strategy to reach the first 200 users at a new university?
- Is a top-down strategy (partner with grad school offices, student government) or a bottom-up strategy (find 10 passionate students and let them spread it) more likely to work for this product?
- What is the minimum viable "seeding" of content (courses, advisors, board posts) needed before a new university feels useful rather than empty?
- Are there specific student communities, subreddits, Discord servers, or campus newsletters where this would land well?
- What is the right message? (What pain point does this solve that resonates immediately when a grad student hears it?)

**3. How to add courses and advisors — manual vs. automated**

Currently campus admins add all courses and advisors by hand through the admin dashboard. This is the biggest content bottleneck. Assess:
- Is manual data entry acceptable at the current scale (3 universities), and up to how many universities before it becomes untenable?
- What are the realistic sources of structured course and faculty data (university websites, Rate My Professors, NSF faculty databases, department pages) and how legally and technically feasible is it to import from each?
- Should the founder build a bulk CSV import tool, a web scraper, or keep it manual for now? Rank these options with tradeoffs.
- Is there a community-sourcing approach (students submit advisor names, courses they've taken) that could work without requiring admin effort?

**4. When to invest in developer collaboration quality**

Right now: 1 developer, no tests, manual migrations, no CI pipeline, no type-safe migration tooling. Assess:
- At what point (number of contributors, user scale, or revenue/grant milestone) does it become worth investing in: (a) Supabase CLI for automated migrations, (b) a test suite, (c) a proper PR review workflow with required checks, (d) splitting the monorepo or adding a separate backend?
- What is the minimum viable collaboration setup for safely onboarding a second developer without risking the production database or live users?
- What would a 2-person engineering team look like for this product 6 months from now, and what would each person own?

**5. Non-profit structure and sustainability**

The product is intentionally non-profit. Assess:
- What are the real tradeoffs of being non-profit for a platform like this — what doors does it open (grants, university partnerships, student trust) and what doors does it close (VC funding, acqui-hire, paid features)?
- What grant programs, university innovation funds, or student affairs budgets could realistically fund server costs and part-time developer time?
- Is there a sustainable model where universities themselves sponsor access (paying for hosting/ops) without compromising the platform's independence?
- At what point, if ever, should the founder consider a different legal/business structure?

**6. Prioritization — what to do next**

Given everything above, rank the following in order of highest-to-lowest leverage for the next 90 days:
- Add more universities
- Fix any scalability concerns
- Build a bulk data import tool for courses/advisors
- Invest in marketing and user acquisition
- Improve developer tooling and test coverage
- Apply for grants or university partnerships
- Build new features (e.g. study groups, event boards, TA ratings)
- Do nothing and let organic growth run for another month

Give concrete reasoning for your ranking, not just a list. Identify the one thing the founder should do first and why.

---

### Output format

Structure your response as:
1. A brief executive summary (5–8 sentences)
2. Detailed analysis for each of the 6 questions above
3. A final 90-day action plan with week-by-week or milestone-by-milestone recommendations
4. A list of the 3 biggest risks to this product's success, and what would mitigate each

Be direct. If something is premature optimization, say so. If something is being underweighted, say so. The founder is technical and can handle candid recommendations.

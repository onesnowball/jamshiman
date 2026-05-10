-- ============================================================
-- GradPeer full schema migration
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type degree_type as enum ('ms', 'phd');
create type content_status as enum ('active', 'flagged', 'removed', 'pending');
create type user_role as enum ('student', 'admin');
create type flag_reason as enum ('inappropriate', 'inaccurate', 'spam', 'harmful', 'other');
create type flag_status as enum ('pending', 'resolved', 'dismissed');
create type content_type as enum ('review', 'post', 'comment', 'course_review');

-- ============================================================
-- UNIVERSITIES
-- ============================================================
create table universities (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  domain       text not null unique,  -- e.g. umich.edu
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

insert into universities (name, domain) values ('University of Michigan', 'umich.edu');

-- ============================================================
-- DEPARTMENTS
-- ============================================================
create table departments (
  id             uuid primary key default uuid_generate_v4(),
  university_id  uuid not null references universities(id) on delete cascade,
  name           text not null,
  slug           text not null,
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  unique(university_id, slug)
);

insert into departments (university_id, name, slug)
select id, 'Mechanical Engineering', 'meche' from universities where domain = 'umich.edu';

-- ============================================================
-- USERS (linked to Supabase auth.users)
-- ============================================================
create table users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email_hash     text not null,          -- SHA256 of email, for admin lookup without storing raw
  university_id  uuid not null references universities(id),
  dept_id        uuid references departments(id),
  degree_type    degree_type,
  role           user_role not null default 'student',
  is_banned      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- ADVISORS
-- ============================================================
create table advisors (
  id             uuid primary key default uuid_generate_v4(),
  university_id  uuid not null references universities(id),
  dept_id        uuid not null references departments(id),
  name           text not null,
  title          text,
  lab_name       text,
  research_areas text[] not null default '{}',
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create index idx_advisors_university on advisors(university_id);
create index idx_advisors_dept on advisors(dept_id);
create index idx_advisors_name on advisors using gin(to_tsvector('english', name));

-- ============================================================
-- ADVISOR REVIEWS
-- ============================================================
create table advisor_reviews (
  id               uuid primary key default uuid_generate_v4(),
  advisor_id       uuid not null references advisors(id) on delete cascade,
  reviewer_id      uuid not null references users(id),
  degree_type      degree_type not null,
  ratings          jsonb not null,          -- AdvisorRatings shape
  original_text    text not null,           -- ADMIN ONLY — pre-anonymization
  anonymized_text  text not null,           -- Public
  years_in_lab     smallint,
  is_current       boolean not null default true,
  status           content_status not null default 'active',
  created_at       timestamptz not null default now(),
  -- One review per advisor per user
  unique(advisor_id, reviewer_id)
);

create index idx_advisor_reviews_advisor on advisor_reviews(advisor_id);
create index idx_advisor_reviews_status on advisor_reviews(status);

-- ============================================================
-- COURSES
-- ============================================================
create table courses (
  id             uuid primary key default uuid_generate_v4(),
  university_id  uuid not null references universities(id),
  dept_id        uuid not null references departments(id),
  code           text not null,           -- e.g. ME 501
  name           text not null,
  credits        smallint,
  created_at     timestamptz not null default now(),
  unique(university_id, code)
);

create index idx_courses_dept on courses(dept_id);

-- ============================================================
-- COURSE REVIEWS
-- ============================================================
create table course_reviews (
  id               uuid primary key default uuid_generate_v4(),
  course_id        uuid not null references courses(id) on delete cascade,
  reviewer_id      uuid not null references users(id),
  semester         text not null,          -- e.g. "Fall 2024"
  degree_type      degree_type not null,
  ratings          jsonb not null,          -- CourseRatings shape
  anonymized_text  text not null,
  original_text    text not null,
  status           content_status not null default 'active',
  created_at       timestamptz not null default now(),
  unique(course_id, reviewer_id, semester)
);

create index idx_course_reviews_course on course_reviews(course_id);

-- ============================================================
-- POSTS (community boards)
-- ============================================================
create table posts (
  id             uuid primary key default uuid_generate_v4(),
  author_id      uuid not null references users(id),
  dept_id        uuid not null references departments(id),
  university_id  uuid not null references universities(id),
  title          text not null,
  body           text not null,
  is_anonymous   boolean not null default true,
  upvotes        integer not null default 0,
  status         content_status not null default 'active',
  created_at     timestamptz not null default now()
);

create index idx_posts_dept on posts(dept_id, status, created_at desc);

-- ============================================================
-- COMMENTS
-- ============================================================
create table comments (
  id            uuid primary key default uuid_generate_v4(),
  post_id       uuid not null references posts(id) on delete cascade,
  author_id     uuid not null references users(id),
  body          text not null,
  is_anonymous  boolean not null default true,
  upvotes       integer not null default 0,
  status        content_status not null default 'active',
  created_at    timestamptz not null default now()
);

create index idx_comments_post on comments(post_id, status);

-- ============================================================
-- SCHEDULES
-- ============================================================
create table schedules (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  semester    text not null,
  name        text not null default 'My Schedule',
  created_at  timestamptz not null default now()
);

create table schedule_courses (
  id           uuid primary key default uuid_generate_v4(),
  schedule_id  uuid not null references schedules(id) on delete cascade,
  course_id    uuid not null references courses(id),
  day_of_week  smallint not null check (day_of_week between 0 and 6),
  start_time   time not null,
  end_time     time not null,
  location     text,
  unique(schedule_id, course_id, day_of_week)
);

-- ============================================================
-- FLAGS (moderation queue)
-- ============================================================
create table flags (
  id            uuid primary key default uuid_generate_v4(),
  reporter_id   uuid not null references users(id),
  content_type  content_type not null,
  content_id    uuid not null,
  reason        flag_reason not null,
  notes         text,
  status        flag_status not null default 'pending',
  resolved_by   uuid references users(id),
  created_at    timestamptz not null default now()
);

create index idx_flags_status on flags(status, created_at desc);
create index idx_flags_content on flags(content_type, content_id);

-- ============================================================
-- AUDIT LOG (admin actions — immutable)
-- ============================================================
create table audit_log (
  id           uuid primary key default uuid_generate_v4(),
  admin_id     uuid not null references users(id),
  action       text not null,
  target_type  text not null,
  target_id    uuid not null,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index idx_audit_log_admin on audit_log(admin_id, created_at desc);

-- ============================================================
-- MATERIALIZED VIEW — advisor aggregate ratings
-- Fast reads, refreshed on each new review via trigger
-- ============================================================
create materialized view advisor_aggregates as
select
  advisor_id,
  count(*) as review_count,
  round(avg((ratings->>'mentorship')::numeric), 2) as avg_mentorship,
  round(avg((ratings->>'funding')::numeric), 2) as avg_funding,
  round(avg((ratings->>'worklife')::numeric), 2) as avg_worklife,
  round(avg((ratings->>'communication')::numeric), 2) as avg_communication,
  round(avg((ratings->>'career')::numeric), 2) as avg_career,
  round(avg(
    ((ratings->>'mentorship')::numeric +
     (ratings->>'funding')::numeric +
     (ratings->>'worklife')::numeric +
     (ratings->>'communication')::numeric +
     (ratings->>'career')::numeric) / 5
  ), 2) as avg_overall
from advisor_reviews
where status = 'active'
group by advisor_id;

create unique index on advisor_aggregates(advisor_id);

-- Function to refresh the materialized view
create or replace function refresh_advisor_aggregates()
returns trigger language plpgsql as $$
begin
  refresh materialized view concurrently advisor_aggregates;
  return null;
end;
$$;

-- Trigger: refresh on insert/update/delete of advisor_reviews
create trigger trg_refresh_advisor_aggregates
after insert or update or delete on advisor_reviews
for each statement execute function refresh_advisor_aggregates();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table universities enable row level security;
alter table departments enable row level security;
alter table users enable row level security;
alter table advisors enable row level security;
alter table advisor_reviews enable row level security;
alter table courses enable row level security;
alter table course_reviews enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table schedules enable row level security;
alter table schedule_courses enable row level security;
alter table flags enable row level security;
alter table audit_log enable row level security;

-- Public read on universities, departments, advisors, courses
create policy "public read universities" on universities for select using (active = true);
create policy "public read departments" on departments for select using (active = true);
create policy "public read advisors" on advisors for select using (active = true);
create policy "public read courses" on courses for select using (true);

-- Users can read their own profile
create policy "users read own" on users for select using (auth.uid() = id);
create policy "users update own" on users for update using (auth.uid() = id);

-- Advisor reviews: public can see active reviews (aggregate gate in app layer)
create policy "read active reviews" on advisor_reviews
  for select using (status = 'active');

-- Reviewers can insert (one per advisor enforced by unique constraint)
create policy "insert own review" on advisor_reviews
  for insert with check (auth.uid() = reviewer_id);

-- Users can see their own reviews regardless of status
create policy "read own reviews" on advisor_reviews
  for select using (auth.uid() = reviewer_id);

-- Course reviews: same pattern
create policy "read active course reviews" on course_reviews
  for select using (status = 'active');
create policy "insert own course review" on course_reviews
  for insert with check (auth.uid() = reviewer_id);
create policy "read own course reviews" on course_reviews
  for select using (auth.uid() = reviewer_id);

-- Posts and comments: authenticated read active
create policy "read active posts" on posts
  for select using (status = 'active');
create policy "insert own post" on posts
  for insert with check (auth.uid() = author_id);

create policy "read active comments" on comments
  for select using (status = 'active');
create policy "insert own comment" on comments
  for insert with check (auth.uid() = author_id);

-- Schedules: private to owner
create policy "read own schedules" on schedules
  for select using (auth.uid() = user_id);
create policy "insert own schedule" on schedules
  for insert with check (auth.uid() = user_id);
create policy "update own schedule" on schedules
  for update using (auth.uid() = user_id);
create policy "delete own schedule" on schedules
  for delete using (auth.uid() = user_id);

create policy "read own schedule courses" on schedule_courses
  for select using (
    schedule_id in (select id from schedules where user_id = auth.uid())
  );
create policy "manage own schedule courses" on schedule_courses
  for all using (
    schedule_id in (select id from schedules where user_id = auth.uid())
  );

-- Flags: authenticated users can insert, only admin can read
create policy "insert flag" on flags
  for insert with check (auth.uid() = reporter_id);

-- Admin policies (service role bypasses RLS; these cover admin JWT)
-- NOTE: in production use a custom JWT claim for admin role
create policy "admin read flags" on flags
  for select using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );
create policy "admin update flags" on flags
  for update using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );
create policy "admin read audit log" on audit_log
  for select using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );
create policy "admin insert audit log" on audit_log
  for insert with check (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );

-- original_text is sensitive — only admins should read it
-- Enforce via a separate admin view or service role only

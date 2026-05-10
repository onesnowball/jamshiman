-- ============================================================
-- 001b — continue schema from where the partial run left off
-- Run this if you already have: enums, universities, departments,
-- users, advisors, advisor_reviews — but NOT courses/posts/etc.
-- ============================================================

-- ============================================================
-- COURSES
-- ============================================================
create table if not exists courses (
  id             uuid primary key default uuid_generate_v4(),
  university_id  uuid not null references universities(id),
  dept_id        uuid not null references departments(id),
  code           text not null,
  name           text not null,
  credits        smallint,
  created_at     timestamptz not null default now(),
  unique(university_id, code)
);

create index if not exists idx_courses_dept on courses(dept_id);

-- ============================================================
-- COURSE REVIEWS
-- ============================================================
create table if not exists course_reviews (
  id               uuid primary key default uuid_generate_v4(),
  course_id        uuid not null references courses(id) on delete cascade,
  reviewer_id      uuid not null references users(id),
  semester         text not null,
  degree_type      degree_type not null,
  ratings          jsonb not null,
  anonymized_text  text not null,
  original_text    text not null,
  status           content_status not null default 'active',
  created_at       timestamptz not null default now(),
  unique(course_id, reviewer_id, semester)
);

create index if not exists idx_course_reviews_course on course_reviews(course_id);

-- ============================================================
-- POSTS (community boards)
-- ============================================================
create table if not exists posts (
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

create index if not exists idx_posts_dept on posts(dept_id, status, created_at desc);

-- ============================================================
-- COMMENTS
-- ============================================================
create table if not exists comments (
  id            uuid primary key default uuid_generate_v4(),
  post_id       uuid not null references posts(id) on delete cascade,
  author_id     uuid not null references users(id),
  body          text not null,
  is_anonymous  boolean not null default true,
  upvotes       integer not null default 0,
  status        content_status not null default 'active',
  created_at    timestamptz not null default now()
);

create index if not exists idx_comments_post on comments(post_id, status);

-- ============================================================
-- SCHEDULES
-- ============================================================
create table if not exists schedules (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  semester    text not null,
  name        text not null default 'My Schedule',
  created_at  timestamptz not null default now()
);

create table if not exists schedule_courses (
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
-- FLAGS
-- ============================================================
create table if not exists flags (
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

create index if not exists idx_flags_status  on flags(status, created_at desc);
create index if not exists idx_flags_content on flags(content_type, content_id);

-- ============================================================
-- AUDIT LOG
-- ============================================================
create table if not exists audit_log (
  id           uuid primary key default uuid_generate_v4(),
  admin_id     uuid not null references users(id),
  action       text not null,
  target_type  text not null,
  target_id    uuid not null,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists idx_audit_log_admin on audit_log(admin_id, created_at desc);

-- ============================================================
-- MATERIALIZED VIEW — advisor aggregates
-- ============================================================
create materialized view if not exists advisor_aggregates as
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

create unique index if not exists advisor_aggregates_advisor_id_idx on advisor_aggregates(advisor_id);

create or replace function refresh_advisor_aggregates()
returns trigger language plpgsql as $$
begin
  refresh materialized view concurrently advisor_aggregates;
  return null;
end;
$$;

drop trigger if exists trg_refresh_advisor_aggregates on advisor_reviews;
create trigger trg_refresh_advisor_aggregates
after insert or update or delete on advisor_reviews
for each statement execute function refresh_advisor_aggregates();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table courses          enable row level security;
alter table course_reviews   enable row level security;
alter table posts            enable row level security;
alter table comments         enable row level security;
alter table schedules        enable row level security;
alter table schedule_courses enable row level security;
alter table flags            enable row level security;
alter table audit_log        enable row level security;

-- Courses: public read
drop policy if exists "public read courses" on courses;
create policy "public read courses" on courses for select using (true);

-- Course reviews
drop policy if exists "read active course reviews" on course_reviews;
create policy "read active course reviews" on course_reviews
  for select using (status = 'active');

drop policy if exists "insert own course review" on course_reviews;
create policy "insert own course review" on course_reviews
  for insert with check (auth.uid() = reviewer_id);

drop policy if exists "read own course reviews" on course_reviews;
create policy "read own course reviews" on course_reviews
  for select using (auth.uid() = reviewer_id);

-- Posts
drop policy if exists "read active posts" on posts;
create policy "read active posts" on posts
  for select using (status = 'active');

drop policy if exists "insert own post" on posts;
create policy "insert own post" on posts
  for insert with check (auth.uid() = author_id);

-- Comments
drop policy if exists "read active comments" on comments;
create policy "read active comments" on comments
  for select using (status = 'active');

drop policy if exists "insert own comment" on comments;
create policy "insert own comment" on comments
  for insert with check (auth.uid() = author_id);

-- Schedules
drop policy if exists "read own schedules" on schedules;
create policy "read own schedules" on schedules
  for select using (auth.uid() = user_id);

drop policy if exists "insert own schedule" on schedules;
create policy "insert own schedule" on schedules
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own schedule" on schedules;
create policy "update own schedule" on schedules
  for update using (auth.uid() = user_id);

drop policy if exists "delete own schedule" on schedules;
create policy "delete own schedule" on schedules
  for delete using (auth.uid() = user_id);

drop policy if exists "read own schedule courses" on schedule_courses;
create policy "read own schedule courses" on schedule_courses
  for select using (
    schedule_id in (select id from schedules where user_id = auth.uid())
  );

drop policy if exists "manage own schedule courses" on schedule_courses;
create policy "manage own schedule courses" on schedule_courses
  for all using (
    schedule_id in (select id from schedules where user_id = auth.uid())
  );

-- Flags
drop policy if exists "insert flag" on flags;
create policy "insert flag" on flags
  for insert with check (auth.uid() = reporter_id);

drop policy if exists "admin read flags" on flags;
create policy "admin read flags" on flags
  for select using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );

drop policy if exists "admin update flags" on flags;
create policy "admin update flags" on flags
  for update using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );

-- Audit log
drop policy if exists "admin read audit log" on audit_log;
create policy "admin read audit log" on audit_log
  for select using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );

drop policy if exists "admin insert audit log" on audit_log;
create policy "admin insert audit log" on audit_log
  for insert with check (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );

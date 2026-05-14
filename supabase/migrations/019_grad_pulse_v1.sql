-- ============================================================
-- 019: Grad Pulse V1
--
-- Adds grad onboarding fields, daily check-ins, aggregates,
-- XP ledger, advisor review requests, and a reward catalog stub.
-- ============================================================

-- ---------- Users: onboarding + academic_status + dept_id ----------
-- Add columns if missing. dept_id and degree_type already exist.
alter table users add column if not exists academic_status text;
alter table users add column if not exists onboarding_completed boolean not null default false;
alter table users add column if not exists onboarding_completed_at timestamptz;
alter table users add column if not exists grad_attested_at timestamptz;

-- Check constraint: academic_status null OR in allowed set
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_academic_status_chk'
  ) then
    alter table users
      add constraint users_academic_status_chk
      check (academic_status is null or academic_status in ('masters','phd','postdoc','other_grad'));
  end if;
end$$;

-- ---------- daily_checkins ----------
create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  university_id uuid not null references universities(id),
  dept_id uuid not null references departments(id),
  academic_status text not null check (academic_status in ('masters','phd','postdoc','other_grad')),
  checkin_date date not null,
  sleep_hours numeric not null check (sleep_hours >= 0 and sleep_hours <= 14),
  stress_level int not null check (stress_level between 1 and 10),
  mood text not null check (mood in ('okay','cooked','caffeinated','locked_in','sleepy','deadline_mode','surviving','weirdly_fine')),
  hours_worked numeric check (hours_worked is null or (hours_worked >= 0 and hours_worked <= 24)),
  caffeine_count int check (caffeine_count is null or (caffeine_count >= 0 and caffeine_count <= 20)),
  worked_after_midnight boolean not null default false,
  context_tag text check (context_tag is null or context_tag in ('normal_week','deadline','conference_submission','quals','job_search','ta_grading','paper_revision','personal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, checkin_date)
);

create index if not exists idx_daily_checkins_date_uni on daily_checkins (checkin_date, university_id);
create index if not exists idx_daily_checkins_user_date on daily_checkins (user_id, checkin_date desc);

-- ---------- pulse_daily_aggregates ----------
create table if not exists pulse_daily_aggregates (
  id uuid primary key default gen_random_uuid(),
  aggregate_date date not null,
  university_id uuid not null references universities(id),
  dept_id uuid references departments(id),
  academic_status text,
  group_type text not null check (group_type in ('school','department','academic_status','department_status')),
  unique_user_count int not null default 0,
  checkin_count int not null default 0,
  avg_sleep numeric,
  avg_stress numeric,
  avg_hours_worked numeric,
  total_caffeine int not null default 0,
  worked_after_midnight_count int not null default 0,
  mood_counts jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Use a unique index with coalesce because nullable cols can't use a plain unique
create unique index if not exists ux_pulse_aggregates_natural
  on pulse_daily_aggregates (
    aggregate_date,
    university_id,
    group_type,
    coalesce(dept_id::text, ''),
    coalesce(academic_status, '')
  );

create index if not exists idx_pulse_aggregates_date_uni on pulse_daily_aggregates (aggregate_date, university_id);

-- ---------- user_xp_ledger ----------
create table if not exists user_xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  university_id uuid not null references universities(id),
  event_type text not null,
  points int not null,
  source_type text,
  source_id uuid,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);

create index if not exists idx_user_xp_user on user_xp_ledger (user_id, created_at desc);

-- ---------- advisor_review_requests ----------
create table if not exists advisor_review_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  advisor_id uuid not null references advisors(id) on delete cascade,
  university_id uuid not null references universities(id),
  created_at timestamptz not null default now(),
  unique(user_id, advisor_id)
);

create index if not exists idx_arr_advisor on advisor_review_requests (advisor_id);

-- ---------- reward_catalog (scaffold only) ----------
create table if not exists reward_catalog (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references universities(id),
  title text not null,
  description text,
  xp_cost int not null default 0,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 013: Suspension request + appeal workflow
-- ============================================================

-- Campus admins request a suspension; global admins approve or deny.
create table if not exists suspension_requests (
  id            uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references users(id) on delete cascade,
  requested_by  uuid not null references users(id),
  university_id uuid not null references universities(id),
  reason        text not null,
  status        text not null default 'pending',   -- pending | approved | denied
  reviewed_by   uuid references users(id),
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- Suspended users can submit an appeal; global admins review it.
create table if not exists suspension_appeals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  reason      text not null,
  status      text not null default 'pending',     -- pending | approved | denied
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Only one pending request per user at a time
create unique index if not exists suspension_requests_pending_uniq
  on suspension_requests (target_user_id)
  where status = 'pending';

-- Only one pending appeal per user at a time
create unique index if not exists suspension_appeals_pending_uniq
  on suspension_appeals (user_id)
  where status = 'pending';

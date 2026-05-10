-- Add Northwestern University
insert into universities (name, domain)
values ('Northwestern University', 'northwestern.edu')
on conflict (domain) do nothing;

-- General board categories for Northwestern
insert into departments (university_id, name, slug)
select u.id, c.name, c.slug
from universities u,
(values
  ('General',             'general'),
  ('Career & Jobs',       'career'),
  ('Housing & Life',      'housing'),
  ('Research & Funding',  'research'),
  ('Mental Health',       'wellbeing'),
  ('Buy / Sell / Free',   'marketplace')
) as c(name, slug)
where u.domain = 'northwestern.edu'
on conflict (university_id, slug) do nothing;

-- Campus admins: per-university admin assignment
-- role = 'admin' in users = global super admin
-- row here = campus admin scoped to that university
create table if not exists campus_admins (
  user_id        uuid not null references auth.users(id) on delete cascade,
  university_id  uuid not null references universities(id) on delete cascade,
  granted_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  primary key (user_id, university_id)
);

alter table campus_admins enable row level security;

-- Only the app (service role) manages this table
create policy "service role only"
  on campus_admins for all
  using (false);

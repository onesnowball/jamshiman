-- ============================================================
-- 010: Add UIUC · is_board_category column · flag dedup
-- ============================================================

-- 1. Add University of Illinois Urbana-Champaign
insert into universities (name, domain, active)
values ('University of Illinois Urbana-Champaign', 'illinois.edu', true)
on conflict (domain) do nothing;

-- 2. Board categories for UIUC
insert into departments (university_id, name, slug, active)
select u.id, c.name, c.slug, true
from universities u,
(values
  ('General',             'general'),
  ('Career & Jobs',       'career'),
  ('Housing & Life',      'housing'),
  ('Research & Funding',  'research'),
  ('Mental Health',       'wellbeing'),
  ('Buy / Sell / Free',   'marketplace')
) as c(name, slug)
where u.domain = 'illinois.edu'
on conflict (university_id, slug) do nothing;

-- 3. Add is_board_category column to departments
--    This replaces the hardcoded BOARD_SLUGS list in the frontend.
alter table departments
  add column if not exists is_board_category boolean not null default false;

-- 4. Mark all known board-category departments across every university
update departments
set is_board_category = true
where slug in ('general','career','housing','research','wellbeing','marketplace');

-- 5. One flag per user per piece of content (prevents spam / duplicate reports)
alter table flags
  drop constraint if exists flags_reporter_content_unique;

alter table flags
  add constraint flags_reporter_content_unique
  unique (reporter_id, content_type, content_id);

-- 6. Clean up any courses whose dept_id points to a department at a different
--    university (data integrity — should be a no-op on clean installs).
delete from courses c
where not exists (
  select 1 from departments d
  where d.id = c.dept_id
  and d.university_id = c.university_id
);

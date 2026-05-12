-- ============================================================
-- 016: School scoping guardrails and UIUC academic departments
-- ============================================================

-- Keep launch schools' board topics in a consistent "folder" shape.
insert into departments (university_id, name, slug, active, is_board_category)
select u.id, c.name, c.slug, true, true
from universities u
cross join (values
  ('General',             'general'),
  ('Career & Jobs',       'career'),
  ('Housing & Life',      'housing'),
  ('Research & Funding',  'research'),
  ('Mental Health',       'wellbeing'),
  ('Buy / Sell / Free',   'marketplace')
) as c(name, slug)
where u.active = true
on conflict (university_id, slug) do update
set
  name = excluded.name,
  active = true,
  is_board_category = true;

-- UIUC academic departments used by advisors/courses/dept boards.
insert into departments (university_id, name, slug, active, is_board_category)
select u.id, d.name, d.slug, true, false
from universities u
cross join (values
  ('Computer Science',                    'cs'),
  ('Materials Science & Engineering',     'matse'),
  ('Mechanical Science & Engineering',    'mechse'),
  ('Physics',                             'phys')
) as d(name, slug)
where u.domain = 'illinois.edu'
on conflict (university_id, slug) do update
set
  name = excluded.name,
  active = true,
  is_board_category = false;

create index if not exists idx_departments_school_kind_active
  on departments (university_id, is_board_category, active, name);

create index if not exists idx_advisors_school_dept_active
  on advisors (university_id, dept_id, active, name);

create index if not exists idx_courses_school_dept_code
  on courses (university_id, dept_id, code);

-- Reject rows whose department belongs to a different school. This preserves
-- the normalized table design while making the school boundary explicit.
create or replace function ensure_department_university_match()
returns trigger language plpgsql as $$
declare
  dept_university_id uuid;
begin
  if new.dept_id is null then
    return new;
  end if;

  select university_id
  into dept_university_id
  from departments
  where id = new.dept_id;

  if dept_university_id is null then
    raise exception 'Department % does not exist', new.dept_id
      using errcode = 'foreign_key_violation';
  end if;

  if dept_university_id <> new.university_id then
    raise exception 'Department % belongs to a different university', new.dept_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists advisors_department_university_match on advisors;
create trigger advisors_department_university_match
before insert or update of university_id, dept_id on advisors
for each row execute function ensure_department_university_match();

drop trigger if exists courses_department_university_match on courses;
create trigger courses_department_university_match
before insert or update of university_id, dept_id on courses
for each row execute function ensure_department_university_match();

drop trigger if exists posts_department_university_match on posts;
create trigger posts_department_university_match
before insert or update of university_id, dept_id on posts
for each row execute function ensure_department_university_match();

drop trigger if exists users_department_university_match on users;
create trigger users_department_university_match
before insert or update of university_id, dept_id on users
for each row execute function ensure_department_university_match();

create or replace function ensure_post_course_university_match()
returns trigger language plpgsql as $$
declare
  course_university_id uuid;
  course_dept_id uuid;
begin
  if new.board_type <> 'course' then
    return new;
  end if;

  select university_id, dept_id
  into course_university_id, course_dept_id
  from courses
  where id = new.course_id;

  if course_university_id is null then
    raise exception 'Course % does not exist', new.course_id
      using errcode = 'foreign_key_violation';
  end if;

  if course_university_id <> new.university_id or course_dept_id <> new.dept_id then
    raise exception 'Course % belongs to a different university or department', new.course_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists posts_course_university_match on posts;
create trigger posts_course_university_match
before insert or update of university_id, dept_id, course_id, board_type on posts
for each row execute function ensure_post_course_university_match();

-- Read-friendly school "folders" for operational checks and future admin views.
create or replace view school_department_folders as
select
  u.id as university_id,
  u.name as university_name,
  u.domain as university_domain,
  d.id as department_id,
  d.name as department_name,
  d.slug as department_slug,
  d.active as department_active,
  d.is_board_category,
  count(distinct a.id) filter (where a.active = true) as active_advisor_count,
  count(distinct c.id) as course_count
from universities u
join departments d on d.university_id = u.id
left join advisors a on a.dept_id = d.id and a.university_id = u.id
left join courses c on c.dept_id = d.id and c.university_id = u.id
group by u.id, u.name, u.domain, d.id, d.name, d.slug, d.active, d.is_board_category;

create or replace view school_advisors as
select
  u.id as university_id,
  u.name as university_name,
  u.domain as university_domain,
  d.id as department_id,
  d.name as department_name,
  d.slug as department_slug,
  a.id as advisor_id,
  a.name as advisor_name,
  a.title,
  a.lab_name,
  a.research_areas,
  a.active,
  a.created_at
from advisors a
join universities u on u.id = a.university_id
join departments d on d.id = a.dept_id and d.university_id = a.university_id;

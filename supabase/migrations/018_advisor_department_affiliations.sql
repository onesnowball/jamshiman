-- ============================================================
-- 018: Cross-department faculty appointments (beyond primary dept_id)
--
-- Primary home department stays on advisors.dept_id.
-- advisor_department_affiliations holds ADDITIONAL departments only
-- (no row where dept_id = advisors.dept_id — enforced by trigger).
-- ============================================================

create table if not exists advisor_department_affiliations (
  advisor_id uuid not null references advisors(id) on delete cascade,
  dept_id    uuid not null references departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (advisor_id, dept_id)
);

create index if not exists idx_ada_dept_id
  on advisor_department_affiliations (dept_id);

create index if not exists idx_ada_advisor_id
  on advisor_department_affiliations (advisor_id);

-- Affiliated department must belong to the same university as the advisor.
create or replace function assert_advisor_affiliation_university_match()
returns trigger language plpgsql as $$
declare
  adv_uni uuid;
  dep_uni uuid;
begin
  select university_id into adv_uni from advisors where id = new.advisor_id;
  if adv_uni is null then
    raise exception 'Advisor % not found', new.advisor_id using errcode = 'foreign_key_violation';
  end if;

  select university_id into dep_uni from departments where id = new.dept_id;
  if dep_uni is null then
    raise exception 'Department % not found', new.dept_id using errcode = 'foreign_key_violation';
  end if;

  if adv_uni <> dep_uni then
    raise exception 'Department % belongs to a different university than advisor', new.dept_id
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from advisors a where a.id = new.advisor_id and a.dept_id = new.dept_id
  ) then
    raise exception 'Use primary department on the advisor record; affiliations are for additional appointments only'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from departments d where d.id = new.dept_id and d.is_board_category = true
  ) then
    raise exception 'Board topics cannot be used as academic advisor departments'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists advisor_affiliation_university_match on advisor_department_affiliations;
create trigger advisor_affiliation_university_match
before insert or update of advisor_id, dept_id on advisor_department_affiliations
for each row execute function assert_advisor_affiliation_university_match();

alter table advisor_department_affiliations enable row level security;

drop policy if exists "public read advisor dept affiliations" on advisor_department_affiliations;
create policy "public read advisor dept affiliations"
  on advisor_department_affiliations for select using (true);

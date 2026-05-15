-- ============================================================
-- 026: Fill in fallback lab names for UMich MechE advisors
--
-- For any advisor in the UMich Mechanical Engineering department
-- whose `lab_name` is NULL, set it to "<LastName> Research Group"
-- (e.g. "Akhavan Research Group", "Liang Research Group"). This
-- matches the typical UMich convention where research groups are
-- named after the PI.
--
-- Idempotent: only touches rows where lab_name IS NULL. Existing
-- explicit lab names (Wooldridge Combustion Laboratory, NeuRRo Lab,
-- etc.) are preserved.
--
-- Easy to override later via the admin UI per-advisor.
-- ============================================================

do $$
declare
  v_university_id uuid;
  v_dept_id uuid;
begin
  select id into v_university_id
    from universities
   where domain = 'umich.edu' and active = true
   limit 1;
  if v_university_id is null then
    raise exception 'No active university with domain umich.edu';
  end if;

  select id into v_dept_id
    from departments
   where university_id = v_university_id
     and is_board_category = false
     and (slug = 'mechanical-engineering' or name ilike '%mechanical engineering%')
   order by case when slug = 'mechanical-engineering' then 0 else 1 end
   limit 1;
  if v_dept_id is null then
    raise exception 'No Mechanical Engineering department found';
  end if;

  -- Derive last-name token from the `name` column.
  -- Handles "First Last", "First Middle Last", and "First M. Last".
  update advisors
     set lab_name = regexp_replace(name, '^.*\s', '') || ' Research Group'
   where university_id = v_university_id
     and dept_id = v_dept_id
     and lab_name is null;
end
$$;

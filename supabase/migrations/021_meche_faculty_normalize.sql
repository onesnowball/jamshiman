-- ============================================================
-- 021: Normalize MechE faculty entries
--
-- - Titles: collapse named-chair/distinguished/joint-appointment
--   descriptors to simple rank (Professor / Associate Professor /
--   Assistant Professor). Prestige info still lives in lab_name and
--   bios elsewhere; cards stay scannable.
-- - Research areas: Title Case, capped at 4 keywords each (was 5).
--
-- Idempotent: matches on (university_id, dept_id, name).
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

  with updates(name, title, research_areas) as (
    values
      ('Anna Stefanopoulou', 'Professor',
        ARRAY['Energy Systems','Batteries','Engine Control','Fuel Cells']),
      ('Karthik Duraisamy',  'Professor',
        ARRAY['Machine Learning','Computational Fluid Dynamics','Turbulence Modeling','Reduced Order Models']),
      ('Bogdan Epureanu',    'Professor',
        ARRAY['Nonlinear Dynamics','Vibrations','Dynamical Systems','Complex Systems']),
      ('Karl Grosh',         'Professor',
        ARRAY['Acoustics','Cochlear Mechanics','MEMS','Biomechanics']),
      ('Robert Gregg',       'Professor',
        ARRAY['Robotics','Powered Prosthetics','Wearable Robots','Biomechanics']),
      ('Solomon Adera',      'Assistant Professor',
        ARRAY['Thermal Management','Heat Transfer','Microfluidics','Energy Systems']),
      ('Allen Liu',          'Professor',
        ARRAY['Mechanobiology','Synthetic Biology','Cell Mechanics','Artificial Cells']),
      ('Wei Lu',             'Professor',
        ARRAY['Battery Materials','Electrochemistry','Energy Storage','Multiscale Modeling'])
  )
  update advisors a
     set title = u.title,
         research_areas = u.research_areas
    from updates u
   where a.university_id = v_university_id
     and a.dept_id = v_dept_id
     and lower(a.name) = lower(u.name);
end
$$;

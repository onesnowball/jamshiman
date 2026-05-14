-- ============================================================
-- 020: Pilot — UMich Mechanical Engineering faculty (8 professors)
--
-- Hand-curated pilot batch. Each professor was verified individually
-- against the U-M ME faculty directory and Google Scholar in
-- May 2026. All eight are tenure-track with recent (2024-2026)
-- publications and active research groups.
--
-- Idempotent: INSERT ... WHERE NOT EXISTS so re-running this migration
-- against an existing prod is safe; no duplicates will be created.
--
-- Department lookup uses (university, slug) and falls back to ILIKE
-- match on name if slug isn't 'mechanical-engineering'. If the
-- department isn't found, the migration raises a clear error rather
-- than silently inserting orphans.
-- ============================================================

do $$
declare
  v_university_id uuid;
  v_dept_id uuid;
begin
  -- University: UMich
  select id into v_university_id
    from universities
   where domain = 'umich.edu' and active = true
   limit 1;

  if v_university_id is null then
    raise exception 'No active university with domain umich.edu found';
  end if;

  -- Department: Mechanical Engineering (academic dept, not board topic)
  select id into v_dept_id
    from departments
   where university_id = v_university_id
     and is_board_category = false
     and (slug = 'mechanical-engineering' or name ilike '%mechanical engineering%')
   order by case when slug = 'mechanical-engineering' then 0 else 1 end
   limit 1;

  if v_dept_id is null then
    raise exception 'No Mechanical Engineering department found for university %', v_university_id;
  end if;

  insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
  select v_university_id, v_dept_id, n.name, n.title, n.lab_name, n.research_areas, true
  from (values
    (
      'Anna Stefanopoulou',
      'Distinguished University Professor, William Clay Ford Professor of Manufacturing',
      'U-M Energy Institute',
      ARRAY['energy systems','batteries','fuel cells','engine control','automotive controls']
    ),
    (
      'Karthik Duraisamy',
      'Professor (joint Aerospace Engineering)',
      'Computational Aerosciences Lab',
      ARRAY['computational fluid dynamics','machine learning','turbulence modeling','reduced order models','uncertainty quantification']
    ),
    (
      'Bogdan Epureanu',
      'Roger L. McCarthy Professor of Mechanical Engineering',
      'Epureanu Research Group',
      ARRAY['nonlinear dynamics','dynamical systems','vibrations','reduced order models','complex systems']
    ),
    (
      'Karl Grosh',
      'Professor (joint Biomedical Engineering)',
      'Grosh Lab',
      ARRAY['acoustics','cochlear mechanics','MEMS','piezoelectric transduction','biomechanics']
    ),
    (
      'Robert Gregg',
      'Professor (joint Robotics, ECE)',
      'Locomotor Control Systems Laboratory',
      ARRAY['legged robots','powered prosthetics','wearable robotics','rehabilitation engineering','biomechanics of locomotion']
    ),
    (
      'Solomon Adera',
      'Assistant Professor',
      'Energy Transport Lab',
      ARRAY['thermal management','heat transfer','micro/nano fluidics','energy systems','engineered surfaces']
    ),
    (
      'Allen Liu',
      'Professor, Associate Chair for Graduate Education (joint BME, Biophysics)',
      'Liu Lab',
      ARRAY['mechanobiology','synthetic biology','artificial cells','cell mechanics','mechanotransduction']
    ),
    (
      'Wei Lu',
      'Professor',
      'Wei Lu Research Group',
      ARRAY['battery materials','electrochemistry','multiscale modeling','energy storage','battery degradation']
    )
  ) as n(name, title, lab_name, research_areas)
  where not exists (
    select 1 from advisors a
    where a.university_id = v_university_id
      and a.dept_id = v_dept_id
      and lower(a.name) = lower(n.name)
  );
end
$$;

-- ============================================================
-- 022: UMich MechE faculty — batch 2 (20 more, hand-verified)
--
-- Each verified individually in May 2026 against either the U-M ME
-- faculty directory, the professor's lab website, Google Scholar,
-- or recent UMich news posts. All have primary or strong joint
-- appointments in Mechanical Engineering and recent (2024-2026)
-- publications. Titles simplified to rank only, per data
-- normalization convention from migration 021.
--
-- Idempotent: INSERT ... WHERE NOT EXISTS on (university, dept,
-- lower(name)).
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

  insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
  select v_university_id, v_dept_id, n.name, n.title, n.lab_name, n.research_areas, true
  from (values
    ('Ellen Arruda',          'Professor',           NULL::text,                                  ARRAY['Soft Tissue Mechanics','Polymers','Tissue Engineering','Constitutive Modeling']),
    ('Kira Barton',           'Professor',           NULL::text,                                  ARRAY['Control Theory','Smart Manufacturing','Iterative Learning Control','Manufacturing Robotics']),
    ('Albert Shih',           'Professor',           NULL::text,                                  ARRAY['Manufacturing','Additive Manufacturing','Biomedical Device Design','Semiconductor Manufacturing']),
    ('Chinedum Okwudire',     'Professor',           NULL::text,                                  ARRAY['Manufacturing Automation','Additive Manufacturing','Nano-Positioning','Smart Manufacturing']),
    ('Jianping Fu',           'Professor',           NULL::text,                                  ARRAY['Mechanobiology','Stem Cell Bioengineering','Microfluidics','BioMEMS']),
    ('Jesse Capecelatro',     'Associate Professor', 'Capecelatro Research Group',                ARRAY['Fluid Mechanics','Multiphase Flow','Turbulence','High Performance Computing']),
    ('Steve Skerlos',         'Professor',           NULL::text,                                  ARRAY['Sustainable Manufacturing','Life Cycle Design','Pollution Prevention','Environmental Systems']),
    ('Mihaela Banu',          'Professor',           NULL::text,                                  ARRAY['Lightweight Materials','Composites','Manufacturing Processes','Automotive Materials']),
    ('Kenn Oldham',           'Professor',           NULL::text,                                  ARRAY['MEMS','Microrobotics','Mechatronics','System Identification']),
    ('Tulga Ersal',           'Associate Professor', NULL::text,                                  ARRAY['System Dynamics','Controls','Vehicle Systems','Energy Systems']),
    ('Bogdan Popa',           'Associate Professor', NULL::text,                                  ARRAY['Acoustic Metamaterials','Elastic Waves','Wave Propagation','Engineered Materials']),
    ('Eric Johnsen',          'Professor',           NULL::text,                                  ARRAY['Fluid Mechanics','Multiphase Flow','Cavitation','Computational Fluid Dynamics']),
    ('Krishna Garikipati',    'Professor',           NULL::text,                                  ARRAY['Computational Mechanics','Materials Modeling','Scientific Computing','PDE Solvers']),
    ('Massoud Kaviany',       'Professor',           NULL::text,                                  ARRAY['Heat Transfer Physics','Porous Media','Multiphase Systems','Thermal Sciences']),
    ('Margaret Wooldridge',   'Professor',           'Wooldridge Combustion Laboratory',          ARRAY['Combustion','Gas Turbines','Diesel Engines','Sustainable Energy']),
    ('Volker Sick',           'Professor',           'Global CO2 Initiative',                     ARRAY['Combustion Imaging','Carbon Capture','Laser Diagnostics','Advanced Energy']),
    ('Brent Gillespie',       'Associate Professor', NULL::text,                                  ARRAY['Haptics','Human-Robot Interaction','Rehabilitation Robotics','Biomechanics']),
    ('Vikram Gavini',         'Professor',           NULL::text,                                  ARRAY['Computational Materials','Ab-Initio Methods','Multiscale Modeling','Density Functional Theory']),
    ('Andre Boehman',         'Professor',           'W.E. Lay Automotive Laboratory',            ARRAY['Combustion','Automotive Engineering','Thermal Sciences','Alternative Fuels']),
    ('Kevin Pipe',            'Professor',           NULL::text,                                  ARRAY['Microscale Heat Transfer','Thermoelectrics','Photovoltaics','Soft Matter Thermal'])
  ) as n(name, title, lab_name, research_areas)
  where not exists (
    select 1 from advisors a
    where a.university_id = v_university_id
      and a.dept_id = v_dept_id
      and lower(a.name) = lower(n.name)
  );
end
$$;

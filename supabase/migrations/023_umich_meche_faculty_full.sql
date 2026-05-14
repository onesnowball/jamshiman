-- ============================================================
-- 023: UMich MechE faculty — full sweep from the official directory
--
-- Source: User pasted the live `me.engin.umich.edu/people/faculty/`
-- directory in May 2026. This migration adds every tenure-track
-- Professor / Associate Professor / Assistant Professor listed.
--
-- Explicitly EXCLUDED:
-- - All "* Emeritus" / "Emerita" / "Research Professor Emeritus"
-- - All Research Scientists / Research Associate Professors
-- - All LEO Lecturers (I-IV)
-- - "Professor of Practice", "Associate Professor of Engineering Practice"
--
-- Combined with prior migrations:
--   020 — 8 pilot faculty
--   021 — normalization (titles + research_areas)
--   022 — 20 batch-2 faculty
--   023 — 73 new faculty (this file) + 1 title fix
-- Final count after all four: ~101 UMich MechE faculty.
--
-- Idempotent (INSERT ... WHERE NOT EXISTS). Safe to re-run.
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

  -- Fix from batch 2: Brent Gillespie was added as Associate Professor;
  -- the directory now lists him as Professor.
  update advisors
     set title = 'Professor'
   where university_id = v_university_id
     and dept_id = v_dept_id
     and lower(name) = 'brent gillespie';

  insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
  select v_university_id, v_dept_id, n.name, n.title, n.lab_name, n.research_areas, true
  from (values
    ('Rayhaneh Akhavan',         'Associate Professor', NULL::text, ARRAY['Turbulence Modeling','Fluid Mechanics','Flow Control','Biomimetics']),
    ('John Allison',             'Professor',           NULL::text, ARRAY['Metallic Materials','Microstructure-Property','Computational Materials','Alloys']),
    ('Shorya Awtar',             'Professor',           NULL::text, ARRAY['Precision Engineering','Flexure Mechanisms','Medical Devices','Mechatronics']),
    ('Rohini Bala Chandran',     'Associate Professor', NULL::text, ARRAY['Radiative Heat Transfer','Electrochemical Engineering','Thermal Sciences','Multiscale Modeling']),
    ('James Barber',             'Professor',           NULL::text, ARRAY['Contact Mechanics','Tribology','Solid Mechanics','Fracture']),
    ('Michael Bernitsas',        'Professor',           NULL::text, ARRAY['Marine Energy','Vortex-Induced Vibration','Mooring Dynamics','Offshore Structures']),
    ('Diann Brei',               'Professor',           NULL::text, ARRAY['Smart Materials','Actuators','Smart Mechanisms','Mechatronics']),
    ('Daniel Bruder',            'Assistant Professor', NULL::text, ARRAY['Soft Robotics','Robot Control','Robot Modeling','Human-Safe Robots']),
    ('Ashley Bucsek',            'Assistant Professor', NULL::text, ARRAY['Shape Memory Alloys','In-Situ X-Ray','Phase Transformations','Lightweight Metals']),
    ('Steve Ceccio',             'Professor',           NULL::text, ARRAY['Cavitation','Multiphase Flow','Experimental Fluid Mechanics','Optical Diagnostics']),
    ('Erin Cech',                'Associate Professor', NULL::text, ARRAY['Sociology Of Engineering','Gender In STEM','Inequalities','Mixed Methods']),
    ('Daniel Cooper',            'Associate Professor', 'Global CO2 Initiative',                       ARRAY['Sustainability','Manufacturing Analysis','CO2 Mitigation','Supply Chains']),
    ('Shanna Daly',              'Associate Professor', NULL::text, ARRAY['Engineering Design','Design Cognition','Socially Engaged Design','Design Education']),
    ('Neil Dasgupta',            'Professor',           NULL::text, ARRAY['Batteries','Solar Energy','Atomic Layer Deposition','Nanomanufacturing']),
    ('Pingsha Dong',             'Professor',           'Welded Structures Laboratory',                ARRAY['Welding','Additive Manufacturing','Fracture Mechanics','Lightweight Structures']),
    ('Martin Erinin',            'Assistant Professor', NULL::text, ARRAY['Ocean Waves','Multiphase Flow','Air-Sea Interaction','Optical Diagnostics']),
    ('Jon Estrada',              'Assistant Professor', NULL::text, ARRAY['Soft Material Mechanics','Cell Mechanics','Cavitation Dynamics','Inverse Methods']),
    ('Yue Fan',                  'Associate Professor', NULL::text, ARRAY['Atomistic Simulation','Amorphous Solids','Defects In Materials','Microstructure Evolution']),
    ('Nima Fazeli',              'Assistant Professor', NULL::text, ARRAY['Robotic Manipulation','Robot Learning','Physical Contact','State Estimation']),
    ('Evgueni Filipov',          'Associate Professor', NULL::text, ARRAY['Origami Structures','Deployable Systems','Reconfigurable Structures','Adaptive Architecture']),
    ('Yogesh Gianchandani',      'Professor',           NULL::text, ARRAY['MEMS','Microsystems','Sensors','Microfluidics']),
    ('Hugo Gonzalez Villasanti', 'Assistant Professor', NULL::text, ARRAY['Control Theory','Social Systems Engineering','Cyber-Physical Systems','Well-Being Engineering']),
    ('Jerard Gordon',            'Assistant Professor', NULL::text, ARRAY['Metal Additive Manufacturing','Process-Property Relations','Computational Mechanics','Materials Discovery']),
    ('Nakhiah Goulbourne',       'Associate Professor', NULL::text, ARRAY['Smart Materials','Aerospace Structures','Soft Composites']),
    ('Jay Guo',                  'Professor',           NULL::text, ARRAY['Nanophotonics','Nanomanufacturing','Photoacoustics','Organic Photovoltaics']),
    ('Maha Haji',                'Assistant Professor', NULL::text, ARRAY['Marine Renewable Energy','Ocean Energy Systems','Systems Engineering']),
    ('Xun Huan',                 'Associate Professor', NULL::text, ARRAY['Uncertainty Quantification','Bayesian Analysis','Data-Driven Modeling','Optimal Experimental Design']),
    ('Matthew Hughes',           'Assistant Professor', NULL::text, ARRAY[]::text[]),
    ('Uduak Inyang-Udoh',        'Assistant Professor', NULL::text, ARRAY['Control Theory','Physics-Guided Machine Learning','Advanced Manufacturing','Thermal Storage']),
    ('Ann Jeffers',              'Associate Professor', NULL::text, ARRAY['Structural Fire Engineering','Finite Element Methods','Multiphysics Simulation','Wildland Fires']),
    ('Julia Kramer',             'Assistant Professor', NULL::text, ARRAY['Engineering Design','Medical Device Design','Global Public Health','Design Education']),
    ('Chandramouli Krishnan',    'Associate Professor', 'NeuRRo Lab',                                  ARRAY['Rehabilitation Robotics','Neuromuscular Function','Biomechanics','Stroke Rehabilitation']),
    ('Ronald Larson',            'Professor',           NULL::text, ARRAY['Polymer Rheology','Complex Fluids','Surfactants','Constitutive Modeling']),
    ('Xiaogan Liang',            'Professor',           NULL::text, ARRAY['Nanofabrication','Nanomanufacturing','Nanoelectronics','Biosensing']),
    ('Henry Liu',                'Professor',           NULL::text, ARRAY['Connected Vehicles','Autonomous Vehicles','Traffic Modeling','Transportation Systems']),
    ('Krishnan Mahesh',          'Professor',           NULL::text, ARRAY['Turbulent Flows','Marine Propulsors','Cavitation','High Performance Computing']),
    ('Xiaoming Mao',             'Professor',           NULL::text, ARRAY['Soft Matter Physics','Self-Assembly','Isostaticity','Statistical Mechanics']),
    ('Edgar Meyhofer',           'Professor',           NULL::text, ARRAY['Bionanotechnology','Cellular Biomechanics','Molecular Biomechanics','Single-Molecule Biophysics']),
    ('Amit Misra',               'Professor',           NULL::text, ARRAY['Nano Mechanics','Electron Microscopy','Metallic Thin Films','Laser Processing']),
    ('Talia Moore',              'Assistant Professor', NULL::text, ARRAY['Bio-Inspired Robotics','Soft Robotics','Terrestrial Locomotion','Animal-Robot Interaction']),
    ('Sungmin Nam',              'Assistant Professor', NULL::text, ARRAY['Mechanobiology','Biomaterials','Mechanotherapy','Medical Devices']),
    ('Gabor Orosz',              'Professor',           NULL::text, ARRAY['Connected Vehicles','Nonlinear Dynamics','Time Delay Systems','Traffic Flow']),
    ('Venkat Raman',             'Professor',           NULL::text, ARRAY['Turbulent Reacting Flows','Combustion Modeling','Hypersonics','Rotating Detonation']),
    ('Pramod Sangi Reddy',       'Professor',           NULL::text, ARRAY['Nanoscale Heat Transfer','Thermoelectrics','Scanning Probe Microscopy','Organic Photovoltaics']),
    ('Elliott Rouse',            'Associate Professor', NULL::text, ARRAY['Exoskeletons','Robotic Prosthetics','Human Locomotion','Brushless Motors']),
    ('Kazu Saitou',              'Professor',           NULL::text, ARRAY['Topology Optimization','Computational Design','Multi-Material Structures','Physics-Informed AI']),
    ('Anchal Sareen',            'Assistant Professor', NULL::text, ARRAY['Marine Hydrodynamics','Renewable Energy','Marine Propulsion','Experimental Fluids']),
    ('Chenhui Shao',             'Associate Professor', NULL::text, ARRAY['Smart Manufacturing','Machine Learning','In-Situ Monitoring','Quality Control']),
    ('Chengzhi Shi',             'Associate Professor', NULL::text, ARRAY['Acoustic Metamaterials','Biomedical Ultrasound','Wave Physics','Underwater Acoustics']),
    ('Alex Shorter',             'Associate Professor', NULL::text, ARRAY['Human Assist Devices','Gait Analysis','Biomechanics','Wearable Devices']),
    ('Kathleen Sienko',          'Professor',           NULL::text, ARRAY['Medical Device Design','Sensory Augmentation','Rehabilitation Engineering','Global Health']),
    ('Jing Sun',                 'Professor',           NULL::text, ARRAY['Marine Systems Control','Connected Vehicles','Renewable Energy Systems','System Optimization']),
    ('Thomas Swinburne',         'Assistant Professor', NULL::text, ARRAY['Plasticity','Irradiation Damage','Rare Event Sampling','Uncertainty Quantification']),
    ('Sita Syal',                'Assistant Professor', NULL::text, ARRAY['Energy Justice','Sustainable Mobility','Human-Centered Design','Energy Policy']),
    ('Wenda Tan',                'Associate Professor', NULL::text, ARRAY['Additive Manufacturing','Computational Materials','CFD For Manufacturing','Welding']),
    ('Jing Tang',                'Assistant Professor', NULL::text, ARRAY['Critical Minerals','Batteries','Carbon Capture','Thermal Sciences']),
    ('Alan Taub',                'Professor',           NULL::text, ARRAY['Lightweight Materials','Polymer Composites','Carbon Nanotube Composites','Sheet Metal Forming']),
    ('Karen A. Thole',           'Professor',           NULL::text, ARRAY['Convective Heat Transfer','Gas Turbines','Turbulent Boundary Layers']),
    ('Michael Thouless',         'Professor',           NULL::text, ARRAY['Interfacial Fracture','Adhesion','Thin Film Mechanics','Polymer Mechanics']),
    ('Dawn Tilbury',             'Professor',           NULL::text, ARRAY['Control Theory','Manufacturing Systems','Networked Control','Controls Education']),
    ('Serife Tol',               'Associate Professor', NULL::text, ARRAY['Metamaterials','Phononic Crystals','Energy Harvesting','Wave Propagation']),
    ('Aaron Towne',              'Associate Professor', NULL::text, ARRAY['Fluid Mechanics','Reduced Order Models','Aeroacoustics','Flow Control']),
    ('Jacinto Ulloa',            'Assistant Professor', NULL::text, ARRAY['Computational Mechanics','Solid Mechanics','Metamaterials','Multiscale Analysis']),
    ('Ramanarayan Vasudevan',    'Associate Professor', NULL::text, ARRAY['Robotics','Autonomous Vehicles','Prosthetic Control','Soft Robotics']),
    ('Christopher Vermillion',   'Associate Professor', NULL::text, ARRAY['Airborne Wind Energy','Marine Energy','Optimal Control','Connected Vehicles']),
    ('Angela Violi',             'Professor',           NULL::text, ARRAY['Multiscale Simulation','Nanoparticle Self-Assembly','Combustion Chemistry','Aerosols']),
    ('Venkat Viswanathan',       'Associate Professor', NULL::text, ARRAY['Batteries','Electric Aviation','Electric Vehicles','Scientific Machine Learning']),
    ('Anthony Waas',             'Professor',           NULL::text, ARRAY['Composite Structures','Aerospace Mechanics','Failure Mechanics','Solid Mechanics']),
    ('Kon-Well Wang',            'Professor',           NULL::text, ARRAY['Smart Structures','Metamaterials','Vibration Control','Energy Harvesting']),
    ('Thomas Wang',              'Professor',           NULL::text, ARRAY['Bio-MEMS','Biomedical Imaging','Micro-Optics','Miniature Sensors']),
    ('Hongyi Xiao',              'Assistant Professor', NULL::text, ARRAY['Granular Materials','Soft Matter','Discrete Particle Simulation','Statistical Physics']),
    ('Euisik Yoon',              'Professor',           NULL::text, ARRAY['BioMEMS','Neurotechnology','Microsystems','Neural Interfaces']),
    ('Lei Zuo',                  'Professor',           NULL::text, ARRAY['Marine Renewable Energy','Energy Harvesting','Vibration Control','Mechatronic Design'])
  ) as n(name, title, lab_name, research_areas)
  where not exists (
    select 1 from advisors a
    where a.university_id = v_university_id
      and a.dept_id = v_dept_id
      and lower(a.name) = lower(n.name)
  );
end
$$;

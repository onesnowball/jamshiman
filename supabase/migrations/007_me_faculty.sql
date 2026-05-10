-- ============================================================
-- Migration 007: UMich Mechanical Engineering Faculty
-- 99 tenure-track faculty: Assistant, Associate, Full Professors
-- Generated from me.engin.umich.edu (Wayback Machine 2025-11-14)
-- Enriched with Semantic Scholar API research areas
-- ============================================================

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Solomon Adera',
  'Assistant Professor',
  NULL,
  ARRAY['heat transfer', 'thermodynamics', 'phase change', 'surfaces and interfaces', 'energy systems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Rayhaneh Akhavan',
  'Associate Professor',
  NULL,
  ARRAY['fluid mechanics', 'turbulence', 'computational fluid dynamics', 'boundary layer flow'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'John Allison',
  'Professor',
  NULL,
  ARRAY['materials science', 'computational materials', 'microstructure', 'lightweight alloys', 'processing-property relationships'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Ellen Arruda',
  'Professor',
  NULL,
  ARRAY['mechanics of materials', 'polymers', 'elastomers', 'soft tissue mechanics', 'continuum mechanics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Shorya Awtar',
  'Professor',
  NULL,
  ARRAY['mechanical design', 'precision engineering', 'mechatronics', 'human-centric design', 'compliant mechanisms'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Rohini Bala Chandran',
  'Associate Professor',
  NULL,
  ARRAY['thermal sciences', 'fluid mechanics', 'multiscale computation', 'radiative heat transfer', 'solar energy'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'James Barber',
  'Professor',
  NULL,
  ARRAY['solid mechanics', 'contact mechanics', 'tribology', 'elasticity', 'fracture mechanics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Kira Barton',
  'Professor',
  NULL,
  ARRAY['control theory', 'iterative learning control', 'multi-agent systems', 'manufacturing automation', 'robotics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Michael Bernitsas',
  'Professor',
  NULL,
  ARRAY['ocean energy', 'vortex induced vibrations', 'marine hydrodynamics', 'renewable energy', 'fluid-structure interaction'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Andre Boehman',
  'Professor',
  'W.E. Lay Automotive Laboratory',
  ARRAY['combustion', 'alternative fuels', 'diesel engines', 'emissions', 'spray combustion'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Diann Brei',
  'Professor',
  NULL,
  ARRAY['smart materials', 'actuators and sensors', 'structural design', 'fluidic systems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Daniel Bruder',
  'Assistant Professor',
  NULL,
  ARRAY['soft robotics', 'robot design', 'control systems', 'non-traditional robotics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Ashley Bucsek',
  'Assistant Professor',
  NULL,
  ARRAY['mechanical behavior of materials', 'micromechanical modeling', 'in situ characterization', 'shape memory alloys'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Jesse Capecelatro',
  'Associate Professor',
  NULL,
  ARRAY['fluid mechanics', 'multiphase flow', 'turbulence', 'reacting flows', 'high-performance computing'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Steve Ceccio',
  'Professor',
  NULL,
  ARRAY['experimental fluid mechanics', 'multiphase flows', 'cavitation', 'drag reduction', 'naval hydrodynamics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Erin Cech',
  'Associate Professor',
  NULL,
  ARRAY['engineering education', 'gender and diversity in STEM', 'sociology of engineering', 'marginalization'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Daniel Cooper',
  'Associate Professor',
  NULL,
  ARRAY['sustainable manufacturing', 'life cycle assessment', 'carbon capture', 'industrial ecology'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Shanna Daly',
  'Associate Professor',
  NULL,
  ARRAY['engineering design', 'idea generation', 'design creativity', 'design education', 'divergent thinking'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Neil Dasgupta',
  'Professor',
  NULL,
  ARRAY['renewable energy', 'batteries', 'solar energy', 'catalysis', 'nanomanufacturing', 'atomic layer deposition'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Cheri Deng',
  'Professor',
  NULL,
  ARRAY['biomedical ultrasound', 'drug delivery', 'mechanobiology', 'cavitation', 'cancer therapy'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Pingsha Dong',
  'Professor',
  'Welded Structures Laboratory',
  ARRAY['structural integrity', 'fatigue', 'welding mechanics', 'fracture mechanics', 'joining processes'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'David Dowling',
  'Professor',
  NULL,
  ARRAY['underwater acoustics', 'hydrodynamics', 'hydro-acoustics', 'structural acoustics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Karthik Duraisamy',
  'Professor',
  NULL,
  ARRAY['computational fluid dynamics', 'machine learning', 'turbulence modeling', 'aerodynamics', 'high-speed flows'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Bogdan Epureanu',
  'Professor',
  'Automotive Research Center',
  ARRAY['vibrations', 'structural health monitoring', 'nonlinear dynamics', 'aerospace systems', 'automotive systems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Martin Erinin',
  'Assistant Professor',
  NULL,
  ARRAY['experimental fluid mechanics', 'multiphase flows', 'free-surface flows', 'wave dynamics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Tulga Ersal',
  'Associate Professor',
  NULL,
  ARRAY['control systems', 'vehicle dynamics', 'simulation-based design', 'human-machine interaction'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Jon Estrada',
  'Assistant Professor',
  NULL,
  ARRAY['soft matter mechanics', 'experimental mechanics', 'impact and shock', 'biological materials'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Yue Fan',
  'Associate Professor',
  NULL,
  ARRAY['computational materials science', 'defects in materials', 'molecular dynamics', 'metallic materials'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Nima Fazeli',
  'Assistant Professor',
  NULL,
  ARRAY['robotic manipulation', 'contact and physical interaction', 'robot learning', 'tactile sensing'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Evgueni Filipov',
  'Associate Professor',
  NULL,
  ARRAY['origami and kirigami structures', 'deployable structures', 'metamaterials', 'structural mechanics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Jianping Fu',
  'Professor',
  NULL,
  ARRAY['microfluidics', 'cell mechanics', 'stem cell engineering', 'organ-on-a-chip', 'biomedical microsystems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Vikram Gavini',
  'Professor',
  NULL,
  ARRAY['computational materials science', 'density functional theory', 'electronic structure', 'ab initio methods'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Yogesh Gianchandani',
  'Professor',
  NULL,
  ARRAY['MEMS', 'microsensors', 'microactuators', 'wireless sensors', 'microfabrication'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Brent Gillespie',
  'Professor',
  NULL,
  ARRAY['haptics', 'human-robot interaction', 'robotics', 'teleoperation'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Hugo Gonzalez Villasanti',
  'Assistant Professor',
  NULL,
  ARRAY['control theory', 'social systems engineering', 'human-centered design', 'autonomous systems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Jerard Gordon',
  'Assistant Professor',
  NULL,
  ARRAY['additive manufacturing', 'metal 3D printing', 'process-structure-property relationships', 'advanced materials'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Nakhiah Goulbourne',
  'Associate Professor',
  NULL,
  ARRAY['mechanics of soft materials', 'electroactive polymers', 'nonlinear mechanics', 'aerospace structures'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Robert Gregg',
  'Associate Professor',
  'Locomotor Control Systems Laboratory',
  ARRAY['wearable robots', 'prosthetics and orthotics', 'bipedal locomotion', 'nonlinear control', 'rehabilitation robotics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Karl Grosh',
  'Professor',
  NULL,
  ARRAY['cochlear mechanics', 'biomedical transducers', 'MEMS', 'vibro-acoustics', 'hearing'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Jay Guo',
  'Professor',
  NULL,
  ARRAY['nanophotonics', 'organic photovoltaics', 'polymer electronics', 'photoacoustics', 'nanofabrication'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Maha Haji',
  'Assistant Professor',
  NULL,
  ARRAY['ocean wave energy', 'tidal energy', 'offshore structures', 'renewable energy systems', 'marine engineering'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Xun (Ryan) Huan',
  'Associate Professor',
  NULL,
  ARRAY['uncertainty quantification', 'data-driven modeling', 'machine learning', 'Bayesian methods', 'computational engineering'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Matthew Hughes',
  'Assistant Professor',
  NULL,
  ARRAY['energy storage', 'electrochemistry', 'sustainable energy', 'materials for energy'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Uduak Inyang-Udoh',
  'Assistant Professor',
  NULL,
  ARRAY['control systems', 'manufacturing processes', 'precision manufacturing'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Eric Johnsen',
  'Professor',
  NULL,
  ARRAY['multiphase flow', 'cavitation', 'bubble dynamics', 'shock waves', 'computational fluid dynamics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Massoud Kaviany',
  'Professor',
  NULL,
  ARRAY['heat transfer', 'thermodynamics', 'energy transport', 'porous media', 'phonon transport'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Julia Kramer',
  'Assistant Professor',
  NULL,
  ARRAY['engineering design', 'design methodology', 'human factors', 'collaborative design'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Chandramouli Krishnan',
  'Associate Professor',
  'Neuromuscular and Rehabilitation Robotics Laboratory',
  ARRAY['rehabilitation robotics', 'neuromuscular systems', 'exoskeletons', 'biomechanics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Ronald Larson',
  'Professor',
  NULL,
  ARRAY['complex fluids', 'polymer dynamics', 'rheology', 'surfactants', 'soft matter'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Xiaogan Liang',
  'Professor',
  NULL,
  ARRAY['nanofabrication', 'nanomanufacturing', 'two-dimensional materials', 'microsystems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Allen Liu',
  'Professor',
  NULL,
  ARRAY['mechanobiology', 'synthetic biology', 'cell mechanics', 'biomedical engineering'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Henry Liu',
  'Professor',
  NULL,
  ARRAY['autonomous vehicles', 'intelligent transportation', 'traffic flow', 'connected vehicles', 'cyber-physical systems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Wei Lu',
  'Professor',
  NULL,
  ARRAY['mechanics of materials', 'nanomechanics', 'energy storage', 'lithium-ion batteries', 'composites'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Krishnan Mahesh',
  'Professor',
  NULL,
  ARRAY['turbulent flow simulation', 'computational fluid dynamics', 'naval hydrodynamics', 'marine propulsion'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Edgar Meyhofer',
  'Professor',
  NULL,
  ARRAY['molecular motors', 'single-molecule biophysics', 'nanoscale heat transfer', 'biophysics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Amit Misra',
  'Professor',
  NULL,
  ARRAY['nano mechanics', 'metallic multilayers', 'electron microscopy', 'laser processing', 'materials interfaces'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Talia Moore',
  'Assistant Professor',
  NULL,
  ARRAY['bio-inspired robotics', 'locomotion', 'snake robots', 'evolutionary robotics', 'biomechanics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Sungmin Nam',
  'Assistant Professor',
  NULL,
  ARRAY['mechanobiology', 'biomaterials', 'biomechanics', 'cell-matrix interactions', 'mechanotherapy'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Chinedum Okwudire',
  'Professor',
  NULL,
  ARRAY['additive manufacturing', 'nano-positioning', 'smart manufacturing', 'manufacturing automation', 'machining'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Kenn Oldham',
  'Professor',
  NULL,
  ARRAY['MEMS', 'micro-mechatronic systems', 'microrobotics', 'piezoelectric actuators'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Gabor Orosz',
  'Professor',
  NULL,
  ARRAY['nonlinear dynamics', 'connected vehicles', 'time delay systems', 'traffic control', 'vehicle platoons'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Kevin Pipe',
  'Professor',
  NULL,
  ARRAY['heat transfer', 'electronic cooling', 'optoelectronics', 'thermoelectrics', 'microscale thermal'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Bogdan Popa',
  'Associate Professor',
  NULL,
  ARRAY['acoustic metamaterials', 'active acoustic control', 'phononic structures', 'wave propagation'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Venkat Raman',
  'Professor',
  NULL,
  ARRAY['turbulent reacting flows', 'combustion simulation', 'computational fluid dynamics', 'renewable fuels'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Pramod Sangi Reddy',
  'Professor',
  NULL,
  ARRAY['nanoscale heat transport', 'thermoelectric devices', 'scanning probe microscopy', 'molecular junctions'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Elliott Rouse',
  'Associate Professor',
  NULL,
  ARRAY['wearable robots', 'prosthetics', 'exoskeletons', 'gait biomechanics', 'rehabilitation robotics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Kazu Saitou',
  'Professor',
  NULL,
  ARRAY['topology optimization', 'computational design', 'manufacturing process design', 'structural design'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Anchal Sareen',
  'Assistant Professor',
  NULL,
  ARRAY['experimental hydrodynamics', 'wind energy', 'renewable energy', 'fluid-structure interaction'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Chenhui Shao',
  'Associate Professor',
  NULL,
  ARRAY['smart manufacturing', 'machine learning for manufacturing', 'in-process quality control', 'data analytics'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Chengzhi Shi',
  'Associate Professor',
  NULL,
  ARRAY['acoustic metamaterials', 'acoustics', 'wave physics', 'active noise control'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Albert Shih',
  'Professor',
  NULL,
  ARRAY['manufacturing', 'biomedical device manufacturing', 'semiconductor manufacturing', 'precision machining'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Alex Shorter',
  'Associate Professor',
  NULL,
  ARRAY['wearable devices', 'biomechanics', 'gait analysis', 'assistive technology'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Volker Sick',
  'Professor',
  'Global CO2 Initiative',
  ARRAY['combustion diagnostics', 'CO2 utilization', 'energy systems', 'optical diagnostics', 'carbon capture'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Kathleen Sienko',
  'Professor',
  NULL,
  ARRAY['sensory augmentation', 'rehabilitation engineering', 'medical device design', 'global health engineering'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Steve Skerlos',
  'Professor',
  NULL,
  ARRAY['sustainable manufacturing', 'life cycle design', 'environmental engineering', 'water treatment'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Anna Stefanopoulou',
  'Professor',
  NULL,
  ARRAY['energy storage systems', 'fuel cells', 'battery management', 'electrochemical systems', 'control systems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Jing Sun',
  'Professor',
  NULL,
  ARRAY['control theory', 'propulsion systems', 'energy management', 'marine systems', 'optimization'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Thomas Swinburne',
  'Assistant Professor',
  NULL,
  ARRAY['computational materials science', 'defect dynamics', 'irradiation damage', 'machine learning for materials'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Sita Syal',
  'Assistant Professor',
  NULL,
  ARRAY['energy justice', 'sustainable energy systems', 'human-centered design', 'equity in engineering'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Wenda Tan',
  'Associate Professor',
  NULL,
  ARRAY['additive manufacturing', 'physics-based modeling', 'laser processing', 'materials processing'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Jing Tang',
  'Assistant Professor',
  NULL,
  ARRAY['critical minerals', 'carbon capture', 'sustainable materials', 'electrochemical systems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Alan Taub',
  'Professor',
  NULL,
  ARRAY['lightweight materials', 'alloy design', 'microstructure-property relationships', 'automotive materials'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Karen A. Thole',
  'Professor',
  NULL,
  ARRAY['convective heat transfer', 'turbine cooling', 'gas turbines', 'turbulent flows'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Michael Thouless',
  'Professor',
  NULL,
  ARRAY['fracture mechanics', 'adhesion', 'thin films', 'micromechanics', 'interfaces'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Dawn Tilbury',
  'Professor',
  NULL,
  ARRAY['control systems', 'manufacturing automation', 'logic control', 'robotics', 'cyber-physical systems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Serife Tol',
  'Associate Professor',
  NULL,
  ARRAY['smart materials', 'metamaterials', 'phononic crystals', 'electromechanical systems', 'energy harvesting'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Aaron Towne',
  'Assistant Professor',
  NULL,
  ARRAY['fluid mechanics', 'aeroacoustics', 'turbulence', 'data-driven methods'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Jacinto Ulloa',
  'Assistant Professor',
  NULL,
  ARRAY['computational mechanics', 'fracture and damage', 'solid mechanics', 'variational methods'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Ramanarayan Vasudevan',
  'Associate Professor',
  NULL,
  ARRAY['safe robotics', 'motion planning', 'autonomous systems', 'formal verification', 'optimization'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Christopher Vermillion',
  'Associate Professor',
  NULL,
  ARRAY['wind energy systems', 'control theory', 'energy harvesting', 'optimization'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Angela Violi',
  'Professor',
  NULL,
  ARRAY['molecular simulation', 'combustion chemistry', 'nanoparticle formation', 'aerosol science'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Venkat Viswanathan',
  'Associate Professor',
  NULL,
  ARRAY['electric aviation', 'electric vehicles', 'batteries', 'scientific machine learning', 'electrochemistry'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Anthony Waas',
  'Professor',
  NULL,
  ARRAY['composite structures', 'aerospace structures', 'failure mechanics', 'progressive damage'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Kon-Well Wang',
  'Professor',
  NULL,
  ARRAY['structural dynamics', 'adaptive structures', 'vibration control', 'piezoelectric systems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Thomas Wang',
  'Professor',
  NULL,
  ARRAY['cardiovascular engineering', 'biomedical engineering', 'medical devices', 'physiological monitoring'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Margaret Wooldridge',
  'Professor',
  NULL,
  ARRAY['combustion', 'alternative fuels', 'ignition chemistry', 'gas turbines', 'clean energy'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Hongyi Xiao',
  'Assistant Professor',
  NULL,
  ARRAY['computational materials science', 'multiscale modeling', 'machine learning for materials'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Euisik Yoon',
  'Professor',
  NULL,
  ARRAY['neural probes', 'MEMS biosensors', 'neural interfaces', 'optoelectronics', 'biomedical microsystems'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

insert into advisors (university_id, dept_id, name, title, lab_name, research_areas, active)
select
  u.id,
  d.id,
  'Lei Zuo',
  'Professor',
  NULL,
  ARRAY['marine renewable energy', 'ocean waves', 'tidal energy', 'energy harvesting', 'vibration control'],
  true
from universities u, departments d
where u.domain = 'umich.edu'
  and d.slug = 'meche'
  and d.university_id = u.id
on conflict do nothing;

-- ============================================================
-- Seed: UMich grad departments + sample courses
-- Run AFTER 001_initial_schema.sql and 002_course_discussions.sql
-- ============================================================

-- ============================================================
-- DEPARTMENTS
-- ============================================================

insert into departments (university_id, name, slug)
select id, dept_name, dept_slug
from universities
cross join (values
  ('Electrical Engineering & Computer Science', 'eecs'),
  ('Aerospace Engineering',                     'aero'),
  ('Civil & Environmental Engineering',         'cee'),
  ('Chemical Engineering',                      'cheme'),
  ('Industrial & Operations Engineering',       'ioe'),
  ('Applied Physics',                           'physics'),
  ('Biomedical Engineering',                    'bme'),
  ('Nuclear Engineering & Radiological Sciences','ners'),
  ('Naval Architecture & Marine Engineering',   'name'),
  ('Materials Science & Engineering',           'mse')
) as t(dept_name, dept_slug)
where domain = 'umich.edu'
on conflict (university_id, slug) do nothing;

-- ============================================================
-- MECHANICAL ENGINEERING COURSES (ME)
-- ============================================================

insert into courses (university_id, dept_id, code, name, credits)
select
  u.id,
  d.id,
  c.code,
  c.name,
  c.credits
from universities u
join departments d on d.university_id = u.id and d.slug = 'meche'
cross join (values
  ('ME 501',  'Advanced Thermodynamics',                  3),
  ('ME 502',  'Continuum Mechanics',                      3),
  ('ME 503',  'Advanced Fluid Mechanics',                 3),
  ('ME 504',  'Advanced Heat Transfer',                   3),
  ('ME 506',  'Combustion',                               3),
  ('ME 523',  'Intermediate Dynamics',                    3),
  ('ME 524',  'Advanced Dynamics',                        3),
  ('ME 540',  'System Dynamics & Control',                3),
  ('ME 541',  'Design of Control Systems',                3),
  ('ME 548',  'Optimal Control',                          3),
  ('ME 551',  'Design Optimization',                      3),
  ('ME 552',  'Finite Element Analysis',                  3),
  ('ME 559',  'Topology Optimization',                    3),
  ('ME 564',  'Mechanics of Solids',                      3),
  ('ME 567',  'Experimental Stress Analysis',             3),
  ('ME 572',  'Machine Design',                           3),
  ('ME 580',  'Advanced Manufacturing Processes',         3),
  ('ME 599',  'Special Topics in Mechanical Engineering', 3),
  ('ME 990',  'Dissertation/Pre-Candidacy',               1),
  ('ME 995',  'Dissertation Research',                    1)
) as c(code, name, credits)
where u.domain = 'umich.edu'
on conflict (university_id, code) do nothing;

-- ============================================================
-- EECS COURSES
-- ============================================================

insert into courses (university_id, dept_id, code, name, credits)
select
  u.id,
  d.id,
  c.code,
  c.name,
  c.credits
from universities u
join departments d on d.university_id = u.id and d.slug = 'eecs'
cross join (values
  ('EECS 501', 'Probability & Random Processes',               3),
  ('EECS 502', 'Stochastic Processes',                         3),
  ('EECS 503', 'Computer Vision',                              3),
  ('EECS 504', 'Graduate Intro to Computer Vision',            3),
  ('EECS 505', 'Computational Data Science',                   3),
  ('EECS 507', 'Introduction to Machine Learning',             3),
  ('EECS 511', 'Integrated Analog/Digital Interface Circuits', 3),
  ('EECS 521', 'Linear Space Methods in Signal Processing',    3),
  ('EECS 545', 'Machine Learning',                             3),
  ('EECS 547', 'Electronic Commerce',                          3),
  ('EECS 551', 'Matrix Methods for Signal Processing',         3),
  ('EECS 560', 'Linear Systems Theory',                        3),
  ('EECS 562', 'Nonlinear Control & Analysis',                 3),
  ('EECS 570', 'Parallel Computer Architecture',               3),
  ('EECS 571', 'Principles of Real-Time Computing',            3),
  ('EECS 572', 'Randomness & Computation',                     3),
  ('EECS 573', 'Microarchitecture',                            3),
  ('EECS 574', 'Computational Complexity Theory',              3),
  ('EECS 592', 'Foundations of Artificial Intelligence',       3),
  ('EECS 598', 'Special Topics',                               3)
) as c(code, name, credits)
where u.domain = 'umich.edu'
on conflict (university_id, code) do nothing;

-- ============================================================
-- AEROSPACE ENGINEERING COURSES
-- ============================================================

insert into courses (university_id, dept_id, code, name, credits)
select
  u.id,
  d.id,
  c.code,
  c.name,
  c.credits
from universities u
join departments d on d.university_id = u.id and d.slug = 'aero'
cross join (values
  ('AERO 501', 'Gas Dynamics',                               3),
  ('AERO 502', 'Aerodynamics',                               3),
  ('AERO 503', 'Computational Fluid Dynamics',               3),
  ('AERO 510', 'Orbital Mechanics',                          3),
  ('AERO 518', 'Aerospace Propulsion',                       3),
  ('AERO 540', 'Flight Dynamics & Control',                  3),
  ('AERO 545', 'Spacecraft Attitude Determination & Control',3),
  ('AERO 550', 'Finite Element Methods in Structures',       3),
  ('AERO 560', 'Aeroelasticity',                             3),
  ('AERO 575', 'Multidisciplinary Design Optimization',      3)
) as c(code, name, credits)
where u.domain = 'umich.edu'
on conflict (university_id, code) do nothing;

-- ============================================================
-- IOE COURSES
-- ============================================================

insert into courses (university_id, dept_id, code, name, credits)
select
  u.id,
  d.id,
  c.code,
  c.name,
  c.credits
from universities u
join departments d on d.university_id = u.id and d.slug = 'ioe'
cross join (values
  ('IOE 510', 'Linear Programming',                        3),
  ('IOE 511', 'Continuous Optimization Methods',           3),
  ('IOE 512', 'Simulation',                                3),
  ('IOE 515', 'Stochastic Processes',                      3),
  ('IOE 516', 'Markov Decision Processes',                 3),
  ('IOE 519', 'Data Envelopment Analysis',                 3),
  ('IOE 521', 'Integer Programming',                       3),
  ('IOE 531', 'Probabilistic Graphical Models',            3),
  ('IOE 534', 'Large-Scale Optimization & Machine Learning',3),
  ('IOE 543', 'Deep Learning',                             3),
  ('IOE 551', 'Engineering Economy',                       3),
  ('IOE 561', 'Logistics & Supply Chain Management',       3),
  ('IOE 571', 'Quality Engineering',                       3)
) as c(code, name, credits)
where u.domain = 'umich.edu'
on conflict (university_id, code) do nothing;

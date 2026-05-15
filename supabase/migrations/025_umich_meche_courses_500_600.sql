-- ============================================================
-- 025: UMich MechE graduate courses (500 + 600 level)
--
-- Source: official `bulletin.engin.umich.edu/courses/me/`, pasted
-- by user in May 2026.
--
-- Includes every 500-level and 600-level MECHENG course EXCEPT:
-- - MECHENG 590 (Study of Research in Selected Topics — research)
-- - MECHENG 599 (Special Topics)
-- Cross-listed courses (e.g., MECHENG 567 / EECS 567 / ROB 510)
-- are stored once under the primary MECHENG code.
--
-- Idempotent: WHERE NOT EXISTS on (university_id, code). Safe to
-- re-run; only missing courses get inserted.
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

  insert into courses (university_id, dept_id, code, name, credits)
  select v_university_id, v_dept_id, c.code, c.name, c.credits
  from (values
    -- 500-level
    ('MECHENG 500', 'Professional Skills for Graduate Student Success',                                         1),
    ('MECHENG 501', 'Mathematical Methods in Mechanical Engineering',                                           3),
    ('MECHENG 502', 'Methods of Differential Equations in Mechanics',                                           3),
    ('MECHENG 505', 'Finite Element Methods in Mechanical Engineering and Applied Mechanics',                   3),
    ('MECHENG 506', 'Computational Modeling of Biological Tissues',                                             3),
    ('MECHENG 507', 'Atomistic Computer Modeling of Materials',                                                 3),
    ('MECHENG 511', 'Solid Continua',                                                                           3),
    ('MECHENG 512', 'Theory of Elasticity',                                                                     3),
    ('MECHENG 513', 'Automotive Body Structures',                                                               3),
    ('MECHENG 515', 'Contact Mechanics',                                                                        3),
    ('MECHENG 516', 'Fracture and Adhesion of Interfaces, and the Mechanics of Layered Materials',              3),
    ('MECHENG 517', 'Mechanics of Soft Materials',                                                              3),
    ('MECHENG 519', 'Theory of Plasticity I',                                                                   3),
    ('MECHENG 520', 'Advanced Fluid Mechanics I',                                                               3),
    ('MECHENG 521', 'Advanced Fluid Mechanics II',                                                              3),
    ('MECHENG 523', 'Computational Fluid Dynamics I',                                                           3),
    ('MECHENG 524', 'Advanced Engineering Acoustics',                                                           3),
    ('MECHENG 527', 'Multiphase Flow',                                                                          3),
    ('MECHENG 530', 'Advanced Heat Transfer',                                                                   3),
    ('MECHENG 533', 'Radiative Heat Transfer',                                                                  3),
    ('MECHENG 535', 'Thermodynamics III',                                                                       3),
    ('MECHENG 537', 'Advanced Combustion',                                                                      3),
    ('MECHENG 538', 'Advanced Internal Combustion Engines',                                                     3),
    ('MECHENG 539', 'Heat Transfer Physics',                                                                    3),
    ('MECHENG 540', 'Intermediate Dynamics',                                                                    3),
    ('MECHENG 541', 'Mechanical Vibrations',                                                                    3),
    ('MECHENG 542', 'Vehicle Dynamics and Automation',                                                          3),
    ('MECHENG 543', 'Analytical and Computational Dynamics I',                                                  3),
    ('MECHENG 545', 'Dynamics and Control of Connected Vehicles',                                               3),
    ('MECHENG 547', 'Bio-Inspired Robot Design',                                                                4),
    ('MECHENG 548', 'Applied Nonlinear Dynamics',                                                               3),
    ('MECHENG 549', 'Stochastic Systems',                                                                       3),
    ('MECHENG 551', 'Mechanisms Design',                                                                        3),
    ('MECHENG 552', 'Mechatronic Systems Design',                                                               4),
    ('MECHENG 553', 'Microelectromechanical Systems',                                                           3),
    ('MECHENG 555', 'Design Optimization',                                                                      3),
    ('MECHENG 557', 'Front-End Design',                                                                         3),
    ('MECHENG 558', 'Discrete Design Optimization',                                                             3),
    ('MECHENG 559', 'Smart Materials and Structures',                                                           3),
    ('MECHENG 560', 'Modeling Dynamic Systems',                                                                 3),
    ('MECHENG 561', 'Design of Digital Control Systems',                                                        3),
    ('MECHENG 562', 'Lithium Battery Lifetime Management',                                                      3),
    ('MECHENG 563', 'Time Series Modeling and System Analysis',                                                 3),
    ('MECHENG 564', 'Linear Systems Theory',                                                                    4),
    ('MECHENG 565', 'Battery Systems and Control',                                                              3),
    ('MECHENG 566', 'Modeling, Analysis, and Control of Hybrid Electric Vehicles',                              3),
    ('MECHENG 567', 'Robot Kinematics and Dynamics',                                                            3),
    ('MECHENG 568', 'Vehicle Control Systems',                                                                  3),
    ('MECHENG 569', 'Control of Advanced Powertrain Systems',                                                   3),
    ('MECHENG 570', 'Fundamentals of Defects in Materials and Applications of Atomistic Modeling',              3),
    ('MECHENG 571', 'Energy Generation and Storage Using Modern Materials',                                     3),
    ('MECHENG 572', 'Rheology and Fracture',                                                                    3),
    ('MECHENG 574', 'Nano/Micro Structure Evolution',                                                            3),
    ('MECHENG 576', 'Fatigue in Mechanical Design',                                                             3),
    ('MECHENG 577', 'Use of Materials and their Selection in Design',                                           3),
    ('MECHENG 580', 'Transport Phenomena in Materials Processing',                                              3),
    ('MECHENG 584', 'Advanced Mechatronics for Manufacturing',                                                  3),
    ('MECHENG 585', 'Machining and Machine Tools',                                                              3),
    ('MECHENG 586', 'Laser Materials Processing',                                                               3),
    ('MECHENG 587', 'Global Manufacturing',                                                                     3),
    ('MECHENG 588', 'Assembly Modeling for Design and Manufacturing',                                           3),
    ('MECHENG 589', 'Sustainable Design of Technology Systems',                                                 3),

    -- 600-level
    ('MECHENG 605', 'Advanced Finite Element Methods in Mechanics',                                             3),
    ('MECHENG 623', 'Hydrodynamic Stability',                                                                   3),
    ('MECHENG 624', 'Turbulent Flow',                                                                           3),
    ('MECHENG 625', 'Nonhomogeneous Fluids',                                                                    3),
    ('MECHENG 626', 'Perturbation Methods for Fluids',                                                          3),
    ('MECHENG 627', 'Wave Motion in Fluids',                                                                    3),
    ('MECHENG 631', 'Statistical Thermodynamics',                                                               3),
    ('MECHENG 641', 'Advanced Vibrations of Structures',                                                        3),
    ('MECHENG 645', 'Wave Propagation in Elastic Solids',                                                       3),
    ('MECHENG 646', 'Locomotion Mechanics and Design/Control of Wearable Robotic Systems',                      3),
    ('MECHENG 648', 'Nonlinear Oscillations and Stability of Mechanical Systems',                               3),
    ('MECHENG 662', 'Advanced Nonlinear Control',                                                               3)
  ) as c(code, name, credits)
  where not exists (
    select 1 from courses x
    where x.university_id = v_university_id
      and x.code = c.code
  );
end
$$;

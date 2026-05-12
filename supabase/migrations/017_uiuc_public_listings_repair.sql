-- ============================================================
-- 017: UIUC — keep public /uiuc/advisors and /uiuc/departments in sync
--
-- Public pages filter:
--   advisors:   active = true
--   departments: active = true AND is_board_category = false
-- Board topics must have is_board_category = true so they never appear as
-- "academic" departments.
-- ============================================================

do $$
declare
  uiuc_id uuid;
begin
  select id into uiuc_id from universities where domain = 'illinois.edu' limit 1;
  if uiuc_id is null then
    raise notice '017_uiuc_public_listings_repair: no illinois.edu university row; skipping';
    return;
  end if;

  -- 1) Canonical board folders (migration 010 once inserted these before flags)
  update departments
  set
    is_board_category = true,
    active = true
  where university_id = uiuc_id
    and slug in ('general', 'career', 'housing', 'research', 'wellbeing', 'marketplace');

  -- 2) Academic departments: show on /uiuc/departments
  update departments
  set active = true
  where university_id = uiuc_id
    and is_board_category = false
    and active = false;

  -- 3) Advisors: show on /uiuc/advisors
  update advisors
  set active = true
  where university_id = uiuc_id
    and active = false;
end $$;

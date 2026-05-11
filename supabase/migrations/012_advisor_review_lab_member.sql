-- ============================================================
-- 012: Replace MS/PhD degree_type with is_lab_member on advisor_reviews
-- ============================================================

-- Allow degree_type to be null (keeping column for backward compat)
alter table advisor_reviews
  alter column degree_type drop not null;

-- New optional field: was the reviewer a lab member of this advisor?
alter table advisor_reviews
  add column if not exists is_lab_member boolean default null;

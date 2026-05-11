-- ============================================================
-- 011: Rename Illinois university to "UIUC"
-- ============================================================

update universities
set name = 'UIUC'
where domain = 'illinois.edu';

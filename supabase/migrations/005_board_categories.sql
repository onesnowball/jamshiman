-- Add general-purpose board categories (non-academic departments)
-- These give the board an Everytime-style feel: not just dept threads,
-- but general campus life categories anyone can post to.

insert into departments (university_id, name, slug)
select u.id, c.name, c.slug
from universities u,
(values
  ('General',             'general'),
  ('Career & Jobs',       'career'),
  ('Housing & Life',      'housing'),
  ('Research & Funding',  'research'),
  ('Mental Health',       'wellbeing'),
  ('Buy / Sell / Free',   'marketplace')
) as c(name, slug)
where u.domain = 'umich.edu'
on conflict (university_id, slug) do nothing;

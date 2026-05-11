-- 014: User display handles
-- Optional vanity handle chosen at first login, used for non-anonymous display.

alter table users
  add column if not exists handle text;

-- Enforce uniqueness and format (3-20 alphanumeric + underscore, lowercase stored)
alter table users
  add constraint handle_unique unique (handle);

alter table users
  add constraint handle_format check (handle ~ '^[a-z0-9_]{3,20}$');

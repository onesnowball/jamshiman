-- 015: Pinned posts
-- Admins can pin posts to the top of a board.

alter table posts
  add column if not exists is_pinned boolean not null default false;

create index if not exists idx_posts_pinned on posts (university_id, is_pinned desc, created_at desc);

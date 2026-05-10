-- ============================================================
-- Course discussions
-- Adds course-linked posts while reusing the existing posts/comments system
-- ============================================================

alter table posts
  add column if not exists course_id uuid references courses(id) on delete cascade,
  add column if not exists board_type text not null default 'department';

update posts
set board_type = 'department'
where board_type is null;

alter table posts
  drop constraint if exists posts_board_type_check;

alter table posts
  add constraint posts_board_type_check
  check (board_type in ('department', 'course'));

alter table posts
  drop constraint if exists posts_board_context_check;

alter table posts
  add constraint posts_board_context_check
  check (
    (board_type = 'department' and course_id is null)
    or (board_type = 'course' and course_id is not null)
  );

create index if not exists idx_posts_course
  on posts(course_id, status, created_at desc);

create index if not exists idx_posts_board_type
  on posts(board_type, status, created_at desc);

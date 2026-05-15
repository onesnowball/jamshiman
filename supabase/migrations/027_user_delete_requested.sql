-- ============================================================
-- 027: User-initiated account deletion request column
--
-- Adds a `delete_requested_at` timestamp to users. Setting it
-- indicates the user has requested account deletion. No data is
-- actually removed automatically — a separate human/admin
-- process (or future cron) acts on the request.
--
-- This unblocks the UX gap where verified-identity users had no
-- visible path to off-board their account.
-- ============================================================

alter table users add column if not exists delete_requested_at timestamptz;
create index if not exists idx_users_delete_requested on users (delete_requested_at) where delete_requested_at is not null;

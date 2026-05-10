create table messages (
  id            uuid        primary key default gen_random_uuid(),
  sender_id     uuid        not null references auth.users(id) on delete cascade,
  recipient_id  uuid        not null references auth.users(id) on delete cascade,
  body          text        not null check (char_length(body) between 1 and 2000),
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index messages_recipient_idx on messages (recipient_id, created_at desc);
create index messages_sender_idx    on messages (sender_id,    created_at desc);

alter table messages enable row level security;

create policy "read own messages"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "send messages"
  on messages for insert
  with check (auth.uid() = sender_id);

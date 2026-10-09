-- Samar cloud storage. Apply in the SQL Editor of project
-- iyblqhxehinylvhdpmxc, then expose the `samar` schema in Data API settings.
-- Requires Supabase Auth users. Never put a service-role key in the browser.

create schema if not exists samar;

create table if not exists samar.records (
  user_id uuid not null references auth.users (id) on delete cascade,
  collection text not null check (collection in (
    'incomeSources', 'incomeEntries', 'buckets', 'cycles', 'allocations',
    'transactions', 'recurringExpenses', 'projects', 'tasks',
    'taskOccurrences', 'timerSessions', 'shoppingItems',
    'scheduledNotifications', 'scheduleBlocks', 'settings'
  )),
  record_id uuid not null,
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ->> 'id' = record_id::text
  ),
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, record_id)
);

alter table samar.records enable row level security;

revoke all on schema samar from public, anon;
grant usage on schema samar to authenticated;
revoke all on samar.records from public, anon;
grant select, insert, update, delete on samar.records to authenticated;

create policy "records_select_own" on samar.records
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "records_insert_own" on samar.records
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "records_update_own" on samar.records
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "records_delete_own" on samar.records
  for delete to authenticated
  using (user_id = (select auth.uid()));

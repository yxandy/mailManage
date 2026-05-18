create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event_type text not null,
  dedupe_key text not null unique,
  title text not null,
  content text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  next_attempt_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  failed_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notification_events_status_check check (
    status in ('pending', 'sent', 'failed', 'ignored')
  ),
  constraint notification_events_attempt_count_check check (attempt_count >= 0),
  constraint notification_events_max_attempts_check check (max_attempts > 0)
);

create index if not exists idx_notification_events_pending
  on public.notification_events (status, next_attempt_at, created_at);

create index if not exists idx_notification_events_created_at
  on public.notification_events (created_at desc);

drop trigger if exists set_notification_events_updated_at on public.notification_events;
create trigger set_notification_events_updated_at
before update on public.notification_events
for each row
execute function public.set_updated_at();

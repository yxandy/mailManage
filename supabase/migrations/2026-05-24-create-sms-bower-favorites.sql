create table if not exists public.sms_bower_favorites (
  id uuid primary key default gen_random_uuid(),
  service_id integer not null,
  service_code text not null,
  service_name text not null,
  min_price numeric(12,4) not null,
  max_price numeric(12,4) not null,
  early_retry_minutes integer not null default 1,
  early_retry_interval_seconds integer not null default 2,
  later_retry_interval_seconds integer not null default 8,
  max_wait_minutes integer not null default 10,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint sms_bower_favorites_price_check check (
    min_price >= 0 and max_price > 0 and max_price >= min_price
  ),
  constraint sms_bower_favorites_retry_check check (
    early_retry_minutes >= 0
    and early_retry_interval_seconds > 0
    and later_retry_interval_seconds > 0
    and max_wait_minutes > 0
  )
);

create unique index if not exists idx_sms_bower_favorites_unique_live_combo
  on public.sms_bower_favorites (
    service_id,
    min_price,
    max_price,
    early_retry_minutes,
    early_retry_interval_seconds,
    later_retry_interval_seconds,
    max_wait_minutes
  )
  where deleted_at is null;

create index if not exists idx_sms_bower_favorites_deleted_at
  on public.sms_bower_favorites (deleted_at);

drop trigger if exists set_sms_bower_favorites_updated_at on public.sms_bower_favorites;
create trigger set_sms_bower_favorites_updated_at
before update on public.sms_bower_favorites
for each row
execute function public.set_updated_at();

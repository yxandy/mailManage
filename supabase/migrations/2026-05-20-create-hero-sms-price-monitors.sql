create table if not exists public.hero_sms_price_monitors (
  id uuid primary key default gen_random_uuid(),
  service_code text not null,
  service_name text not null,
  country_id integer not null,
  country_name text not null,
  operator_code text not null default 'any',
  operator_name text not null default '任意运营商',
  target_price numeric(12,4) not null,
  status text not null default 'active',
  last_checked_at timestamptz,
  last_available_count integer,
  last_error text,
  triggered_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hero_sms_price_monitors_status_check check (
    status in ('active', 'paused', 'triggered', 'deleted')
  ),
  constraint hero_sms_price_monitors_target_price_check check (target_price > 0),
  constraint hero_sms_price_monitors_available_count_check check (
    last_available_count is null or last_available_count >= 0
  )
);

create unique index if not exists idx_hero_sms_price_monitors_unique_live_target
  on public.hero_sms_price_monitors (service_code, country_id, operator_code, target_price)
  where deleted_at is null;

create index if not exists idx_hero_sms_price_monitors_status_checked_at
  on public.hero_sms_price_monitors (status, last_checked_at);

create index if not exists idx_hero_sms_price_monitors_deleted_at
  on public.hero_sms_price_monitors (deleted_at);

drop trigger if exists set_hero_sms_price_monitors_updated_at on public.hero_sms_price_monitors;
create trigger set_hero_sms_price_monitors_updated_at
before update on public.hero_sms_price_monitors
for each row
execute function public.set_updated_at();

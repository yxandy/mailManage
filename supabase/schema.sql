create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.email_accounts (
  id uuid primary key default gen_random_uuid(),
  email_name text not null,
  source text,
  user_name text,
  is_plus boolean not null default false,
  birthday date,
  registered_at timestamptz,
  registered_location text,
  is_registered_cg boolean not null default false,
  cg_registered_at timestamptz,
  is_linked_s2a boolean not null default false,
  linked_at timestamptz,
  is_expired boolean not null default false,
  expired_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint email_accounts_linked_at_check check (
    (is_linked_s2a = false and linked_at is null)
    or (is_linked_s2a = true)
  ),
  constraint email_accounts_cg_registered_at_check check (
    (is_registered_cg = false and cg_registered_at is null)
    or (is_registered_cg = true)
  ),
  constraint email_accounts_expired_at_check check (
    (is_expired = false and expired_at is null)
    or (is_expired = true)
  )
);

create table if not exists public.system_settings (
  id smallint primary key default 1,
  cny_price numeric(10,2) not null default 34.34,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint system_settings_singleton_check check (id = 1)
);

create table if not exists public.hero_sms_activations (
  id uuid primary key default gen_random_uuid(),
  activation_id text not null unique,
  phone_number text not null,
  service_code text not null,
  service_name text not null,
  country_id integer not null,
  country_name text not null,
  country_phone_code integer not null,
  operator_code text not null,
  activation_cost numeric(12,4) not null,
  currency_code integer not null,
  can_get_another_sms boolean not null default false,
  activation_time timestamptz not null,
  activation_end_time timestamptz not null,
  activation_status text,
  sms_code text,
  sms_text text,
  last_sms_code text,
  last_sms_text text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.hero_sms_favorites (
  id uuid primary key default gen_random_uuid(),
  service_code text not null,
  service_name text not null,
  country_id integer not null,
  country_name text not null,
  operator_code text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hero_sms_favorites_unique_selection unique (service_code, country_id, operator_code)
);

create table if not exists public.hero_sms_activation_history (
  id uuid primary key default gen_random_uuid(),
  activation_id text not null unique,
  activation_date timestamptz,
  phone_number text not null,
  activation_cost numeric(12,4),
  currency_code integer,
  service_code text,
  service_name text,
  country_id integer,
  country_name text,
  operator_code text,
  activation_status text,
  sms_text text,
  raw_payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sms_bower_activations (
  id uuid primary key default gen_random_uuid(),
  activation_id text not null unique,
  phone_number text not null,
  service_code text not null,
  service_name text not null,
  country_id integer not null,
  country_name text not null,
  country_phone_code integer,
  provider_id text,
  provider_ids text not null,
  activation_cost numeric(12,4) not null,
  activation_operator text,
  can_get_another_sms boolean not null default false,
  activation_time timestamptz,
  activation_status text not null default 'STATUS_WAIT_CODE',
  sms_code text,
  sms_text text,
  last_sms_code text,
  last_sms_text text,
  is_active boolean not null default true,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sms_bower_favorites (
  id uuid primary key default gen_random_uuid(),
  service_id integer not null,
  service_code text not null,
  service_name text not null,
  min_price numeric(12,4) not null,
  max_price numeric(12,4) not null,
  rank_ids integer[] not null default array[1, 2, 3],
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
  constraint sms_bower_favorites_rank_ids_check check (
    cardinality(rank_ids) > 0
    and rank_ids <@ array[1, 2, 3]
  ),
  constraint sms_bower_favorites_retry_check check (
    early_retry_minutes >= 0
    and early_retry_interval_seconds > 0
    and later_retry_interval_seconds > 0
    and max_wait_minutes > 0
  )
);

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

create index if not exists idx_email_accounts_deleted_at
  on public.email_accounts (deleted_at);

create index if not exists idx_email_accounts_registered_at
  on public.email_accounts (registered_at desc);

create index if not exists idx_email_accounts_email_name
  on public.email_accounts (email_name);

create index if not exists idx_email_accounts_user_name
  on public.email_accounts (user_name);

create index if not exists idx_email_accounts_is_plus
  on public.email_accounts (is_plus);

create index if not exists idx_hero_sms_activations_is_active
  on public.hero_sms_activations (is_active);

create index if not exists idx_hero_sms_activations_created_at
  on public.hero_sms_activations (created_at desc);

create index if not exists idx_hero_sms_favorites_created_at
  on public.hero_sms_favorites (created_at desc);

create index if not exists idx_hero_sms_favorites_deleted_at
  on public.hero_sms_favorites (deleted_at);

create index if not exists idx_hero_sms_activation_history_activation_date
  on public.hero_sms_activation_history (activation_date desc);

create index if not exists idx_hero_sms_activation_history_service_country
  on public.hero_sms_activation_history (service_code, country_id);

create index if not exists idx_hero_sms_activation_history_operator
  on public.hero_sms_activation_history (operator_code);

create index if not exists idx_sms_bower_activations_is_active
  on public.sms_bower_activations (is_active);

create index if not exists idx_sms_bower_activations_created_at
  on public.sms_bower_activations (created_at desc);

create unique index if not exists idx_sms_bower_favorites_unique_live_combo
  on public.sms_bower_favorites (
    service_id,
    min_price,
    max_price,
    rank_ids,
    early_retry_minutes,
    early_retry_interval_seconds,
    later_retry_interval_seconds,
    max_wait_minutes
  )
  where deleted_at is null;

create index if not exists idx_sms_bower_favorites_deleted_at
  on public.sms_bower_favorites (deleted_at);

create unique index if not exists idx_hero_sms_price_monitors_unique_live_target
  on public.hero_sms_price_monitors (service_code, country_id, operator_code, target_price)
  where deleted_at is null;

create index if not exists idx_hero_sms_price_monitors_status_checked_at
  on public.hero_sms_price_monitors (status, last_checked_at);

create index if not exists idx_hero_sms_price_monitors_deleted_at
  on public.hero_sms_price_monitors (deleted_at);

create index if not exists idx_notification_events_pending
  on public.notification_events (status, next_attempt_at, created_at);

create index if not exists idx_notification_events_created_at
  on public.notification_events (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();

drop trigger if exists set_email_accounts_updated_at on public.email_accounts;
create trigger set_email_accounts_updated_at
before update on public.email_accounts
for each row
execute function public.set_updated_at();

drop trigger if exists set_system_settings_updated_at on public.system_settings;
create trigger set_system_settings_updated_at
before update on public.system_settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_hero_sms_activations_updated_at on public.hero_sms_activations;
create trigger set_hero_sms_activations_updated_at
before update on public.hero_sms_activations
for each row
execute function public.set_updated_at();

drop trigger if exists set_hero_sms_favorites_updated_at on public.hero_sms_favorites;
create trigger set_hero_sms_favorites_updated_at
before update on public.hero_sms_favorites
for each row
execute function public.set_updated_at();

drop trigger if exists set_hero_sms_activation_history_updated_at on public.hero_sms_activation_history;
create trigger set_hero_sms_activation_history_updated_at
before update on public.hero_sms_activation_history
for each row
execute function public.set_updated_at();

drop trigger if exists set_sms_bower_activations_updated_at on public.sms_bower_activations;
create trigger set_sms_bower_activations_updated_at
before update on public.sms_bower_activations
for each row
execute function public.set_updated_at();

drop trigger if exists set_sms_bower_favorites_updated_at on public.sms_bower_favorites;
create trigger set_sms_bower_favorites_updated_at
before update on public.sms_bower_favorites
for each row
execute function public.set_updated_at();

drop trigger if exists set_hero_sms_price_monitors_updated_at on public.hero_sms_price_monitors;
create trigger set_hero_sms_price_monitors_updated_at
before update on public.hero_sms_price_monitors
for each row
execute function public.set_updated_at();

drop trigger if exists set_notification_events_updated_at on public.notification_events;
create trigger set_notification_events_updated_at
before update on public.notification_events
for each row
execute function public.set_updated_at();

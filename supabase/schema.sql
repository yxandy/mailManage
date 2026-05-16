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
  operator_code text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint hero_sms_favorites_unique_selection unique (service_code, country_id, operator_code)
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

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

create index if not exists idx_hero_sms_activations_is_active
  on public.hero_sms_activations (is_active);

create index if not exists idx_hero_sms_activations_created_at
  on public.hero_sms_activations (created_at desc);

drop trigger if exists set_hero_sms_activations_updated_at on public.hero_sms_activations;
create trigger set_hero_sms_activations_updated_at
before update on public.hero_sms_activations
for each row
execute function public.set_updated_at();

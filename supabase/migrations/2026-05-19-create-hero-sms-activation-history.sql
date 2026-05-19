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

create index if not exists idx_hero_sms_activation_history_activation_date
  on public.hero_sms_activation_history (activation_date desc);

create index if not exists idx_hero_sms_activation_history_service_country
  on public.hero_sms_activation_history (service_code, country_id);

create index if not exists idx_hero_sms_activation_history_operator
  on public.hero_sms_activation_history (operator_code);

drop trigger if exists set_hero_sms_activation_history_updated_at on public.hero_sms_activation_history;
create trigger set_hero_sms_activation_history_updated_at
before update on public.hero_sms_activation_history
for each row
execute function public.set_updated_at();

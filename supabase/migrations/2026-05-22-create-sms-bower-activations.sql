create table if not exists public.sms_bower_activations (
  id uuid primary key default gen_random_uuid(),
  activation_id text not null unique,
  phone_number text not null,
  service_code text not null,
  service_name text not null,
  country_id integer not null,
  country_name text not null,
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

create index if not exists idx_sms_bower_activations_is_active
  on public.sms_bower_activations (is_active);

create index if not exists idx_sms_bower_activations_created_at
  on public.sms_bower_activations (created_at desc);

drop trigger if exists set_sms_bower_activations_updated_at on public.sms_bower_activations;
create trigger set_sms_bower_activations_updated_at
before update on public.sms_bower_activations
for each row
execute function public.set_updated_at();

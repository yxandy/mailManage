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

create index if not exists idx_hero_sms_favorites_created_at
  on public.hero_sms_favorites (created_at desc);

drop trigger if exists set_hero_sms_favorites_updated_at on public.hero_sms_favorites;
create trigger set_hero_sms_favorites_updated_at
before update on public.hero_sms_favorites
for each row
execute function public.set_updated_at();

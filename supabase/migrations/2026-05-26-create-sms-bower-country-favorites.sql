create table if not exists public.sms_bower_country_favorites (
  id uuid primary key default gen_random_uuid(),
  country_id integer not null,
  country_name text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_sms_bower_country_favorites_unique_live_country
  on public.sms_bower_country_favorites (country_id)
  where deleted_at is null;

create index if not exists idx_sms_bower_country_favorites_deleted_at
  on public.sms_bower_country_favorites (deleted_at);

drop trigger if exists set_sms_bower_country_favorites_updated_at on public.sms_bower_country_favorites;
create trigger set_sms_bower_country_favorites_updated_at
before update on public.sms_bower_country_favorites
for each row
execute function public.set_updated_at();

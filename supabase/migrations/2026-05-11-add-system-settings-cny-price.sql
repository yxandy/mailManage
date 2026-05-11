create table if not exists public.system_settings (
  id smallint primary key default 1,
  cny_price numeric(10,2) not null default 34.34,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint system_settings_singleton_check check (id = 1)
);

insert into public.system_settings (id, cny_price)
values (1, 34.34)
on conflict (id) do nothing;

drop trigger if exists set_system_settings_updated_at on public.system_settings;
create trigger set_system_settings_updated_at
before update on public.system_settings
for each row
execute function public.set_updated_at();

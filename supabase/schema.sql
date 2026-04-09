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
  user_name text,
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

create index if not exists idx_email_accounts_deleted_at
  on public.email_accounts (deleted_at);

create index if not exists idx_email_accounts_registered_at
  on public.email_accounts (registered_at desc);

create index if not exists idx_email_accounts_email_name
  on public.email_accounts (email_name);

create index if not exists idx_email_accounts_user_name
  on public.email_accounts (user_name);

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

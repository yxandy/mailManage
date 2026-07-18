create table if not exists public.email_account_type_states (
  id uuid primary key default gen_random_uuid(),
  email_account_id uuid not null references public.email_accounts (id) on delete cascade,
  type_code text not null,
  is_registered boolean not null default false,
  registered_at timestamptz,
  is_linked_s2a boolean not null default false,
  linked_at timestamptz,
  is_expired boolean not null default false,
  expired_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint email_account_type_states_type_code_check check (
    length(trim(type_code)) > 0
  ),
  constraint email_account_type_states_registered_at_check check (
    (is_registered = false and registered_at is null)
    or (is_registered = true)
  ),
  constraint email_account_type_states_linked_at_check check (
    (is_linked_s2a = false and linked_at is null)
    or (is_linked_s2a = true)
  ),
  constraint email_account_type_states_expired_at_check check (
    (is_expired = false and expired_at is null)
    or (is_expired = true)
  )
);

create unique index if not exists idx_email_account_type_states_unique_live_type
  on public.email_account_type_states (email_account_id, type_code)
  where deleted_at is null;

create index if not exists idx_email_account_type_states_type_deleted
  on public.email_account_type_states (type_code, deleted_at);

create index if not exists idx_email_account_type_states_email_account_id
  on public.email_account_type_states (email_account_id);

insert into public.email_account_type_states (
  email_account_id,
  type_code,
  is_registered,
  registered_at,
  is_linked_s2a,
  linked_at,
  is_expired,
  expired_at,
  created_at,
  updated_at
)
select
  id,
  case when is_plus then 'plus' else 'free' end,
  is_registered_cg,
  cg_registered_at,
  is_linked_s2a,
  linked_at,
  is_expired,
  expired_at,
  created_at,
  updated_at
from public.email_accounts
where deleted_at is null
on conflict do nothing;

drop trigger if exists set_email_account_type_states_updated_at on public.email_account_type_states;
create trigger set_email_account_type_states_updated_at
before update on public.email_account_type_states
for each row
execute function public.set_updated_at();

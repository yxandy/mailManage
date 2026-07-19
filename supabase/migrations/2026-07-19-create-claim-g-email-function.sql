alter table public.email_account_type_states
  add column if not exists claimed_at timestamptz;

create index if not exists idx_email_account_type_states_g_claim_pool
  on public.email_account_type_states (type_code, is_registered, claimed_at, deleted_at);

create or replace function public.claim_next_unregistered_g_email()
returns table (
  email_account_id uuid,
  email_name text,
  claimed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidate as (
    select
      email_accounts.id as email_account_id,
      email_accounts.email_name,
      email_account_type_states.id as state_id
    from public.email_account_type_states
    join public.email_accounts
      on email_accounts.id = email_account_type_states.email_account_id
    where email_account_type_states.type_code = 'g'
      and email_account_type_states.deleted_at is null
      and email_account_type_states.is_registered = false
      and email_account_type_states.claimed_at is null
      and email_accounts.deleted_at is null
    order by email_accounts.created_at asc, email_accounts.email_name asc
    for update of email_account_type_states skip locked
    limit 1
  )
  update public.email_account_type_states
  set
    claimed_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  from candidate
  where email_account_type_states.id = candidate.state_id
  returning
    candidate.email_account_id,
    candidate.email_name,
    email_account_type_states.claimed_at;
end;
$$;

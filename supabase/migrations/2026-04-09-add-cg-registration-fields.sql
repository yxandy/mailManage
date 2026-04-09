alter table public.email_accounts
  add column if not exists is_registered_cg boolean not null default false,
  add column if not exists cg_registered_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_accounts_cg_registered_at_check'
  ) then
    alter table public.email_accounts
      add constraint email_accounts_cg_registered_at_check check (
        (is_registered_cg = false and cg_registered_at is null)
        or (is_registered_cg = true)
      );
  end if;
end
$$;

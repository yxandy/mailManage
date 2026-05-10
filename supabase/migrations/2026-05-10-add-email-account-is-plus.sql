alter table public.email_accounts
  add column if not exists is_plus boolean not null default false;

create index if not exists idx_email_accounts_is_plus
  on public.email_accounts (is_plus);

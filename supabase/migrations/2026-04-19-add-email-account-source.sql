alter table public.email_accounts
  add column if not exists source text;

alter table public.email_accounts
  alter column user_name drop not null,
  alter column registered_at drop not null,
  alter column registered_location drop not null;

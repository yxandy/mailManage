alter table public.hero_sms_favorites
add column if not exists deleted_at timestamptz;

create index if not exists idx_hero_sms_favorites_deleted_at
  on public.hero_sms_favorites (deleted_at);

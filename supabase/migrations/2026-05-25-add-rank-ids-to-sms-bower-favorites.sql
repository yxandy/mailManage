alter table public.sms_bower_favorites
  add column if not exists rank_ids integer[] not null default array[1, 2, 3];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sms_bower_favorites_rank_ids_check'
  ) then
    alter table public.sms_bower_favorites
      add constraint sms_bower_favorites_rank_ids_check check (
        cardinality(rank_ids) > 0
        and rank_ids <@ array[1, 2, 3]
      );
  end if;
end $$;

drop index if exists public.idx_sms_bower_favorites_unique_live_combo;

create unique index if not exists idx_sms_bower_favorites_unique_live_combo
  on public.sms_bower_favorites (
    service_id,
    min_price,
    max_price,
    rank_ids,
    early_retry_minutes,
    early_retry_interval_seconds,
    later_retry_interval_seconds,
    max_wait_minutes
  )
  where deleted_at is null;

alter table public.hero_sms_activations
add column if not exists last_sms_code text,
add column if not exists last_sms_text text;

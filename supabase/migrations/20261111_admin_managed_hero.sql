create table if not exists public.hero_settings (
  id text primary key default 'landing' check (id = 'landing'),
  slides jsonb not null default '[]'::jsonb
    check (jsonb_typeof(slides) = 'array'),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.hero_settings enable row level security;

create policy "hero_settings_public_read"
on public.hero_settings
for select
to anon, authenticated
using (true);

grant select on public.hero_settings to anon, authenticated;
revoke insert, update, delete on public.hero_settings from anon, authenticated;

create table if not exists public.petit_sot_pinterest_connections (
  id integer primary key default 1 check (id = 1),
  pinterest_user_id text,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  refresh_token_expires_at timestamptz,
  scope text,
  board_ids jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.petit_sot_pinterest_connections enable row level security;

drop policy if exists "admin can manage pinterest connection" on public.petit_sot_pinterest_connections;
create policy "admin can manage pinterest connection"
on public.petit_sot_pinterest_connections
for all
to authenticated
using (exists (
  select 1 from public.petit_sot_admins a
  where a.user_id = auth.uid()
))
with check (exists (
  select 1 from public.petit_sot_admins a
  where a.user_id = auth.uid()
));

create table if not exists public.petit_sot_pinterest_pins (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null unique references public.petit_sot_artworks(id) on delete cascade,
  pinterest_pin_id text unique,
  board_id text,
  pin_url text,
  state text not null default 'pending' check (state in ('pending', 'published', 'error')),
  error text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.petit_sot_pinterest_pins enable row level security;

drop policy if exists "admin can manage pinterest pins" on public.petit_sot_pinterest_pins;
create policy "admin can manage pinterest pins"
on public.petit_sot_pinterest_pins
for all
to authenticated
using (exists (
  select 1 from public.petit_sot_admins a
  where a.user_id = auth.uid()
))
with check (exists (
  select 1 from public.petit_sot_admins a
  where a.user_id = auth.uid()
));

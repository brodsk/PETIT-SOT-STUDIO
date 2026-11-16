create table if not exists public.petit_sot_print_variants (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.petit_sot_artworks(id) on delete cascade,
  prodigi_sku text not null,
  size_label text not null,
  width_mm integer not null check (width_mm > 0),
  height_mm integer not null check (height_mm > 0),
  paper_type text not null default 'fine_art',
  retail_price_eur numeric(10,2) not null check (retail_price_eur > 0),
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint petit_sot_print_variants_artwork_sku_unique unique (artwork_id, prodigi_sku)
);

create index if not exists petit_sot_print_variants_active_artwork_idx
  on public.petit_sot_print_variants (artwork_id, active, sort_order);

alter table public.petit_sot_print_variants enable row level security;

grant select on public.petit_sot_print_variants to anon, authenticated;
grant insert, update, delete on public.petit_sot_print_variants to authenticated;

drop policy if exists petit_sot_public_active_print_variants on public.petit_sot_print_variants;
create policy petit_sot_public_active_print_variants
  on public.petit_sot_print_variants
  for select
  to anon, authenticated
  using (active = true);

drop policy if exists petit_sot_admin_print_variants_select on public.petit_sot_print_variants;
create policy petit_sot_admin_print_variants_select
  on public.petit_sot_print_variants
  for select
  to authenticated
  using (exists (
    select 1 from public.petit_sot_admins a
    where a.user_id = (select auth.uid())
  ));

drop policy if exists petit_sot_admin_print_variants_insert on public.petit_sot_print_variants;
create policy petit_sot_admin_print_variants_insert
  on public.petit_sot_print_variants
  for insert
  to authenticated
  with check (exists (
    select 1 from public.petit_sot_admins a
    where a.user_id = (select auth.uid())
  ));

drop policy if exists petit_sot_admin_print_variants_update on public.petit_sot_print_variants;
create policy petit_sot_admin_print_variants_update
  on public.petit_sot_print_variants
  for update
  to authenticated
  using (exists (
    select 1 from public.petit_sot_admins a
    where a.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.petit_sot_admins a
    where a.user_id = (select auth.uid())
  ));

drop policy if exists petit_sot_admin_print_variants_delete on public.petit_sot_print_variants;
create policy petit_sot_admin_print_variants_delete
  on public.petit_sot_print_variants
  for delete
  to authenticated
  using (exists (
    select 1 from public.petit_sot_admins a
    where a.user_id = (select auth.uid())
  ));

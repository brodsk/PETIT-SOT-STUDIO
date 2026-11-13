create table if not exists public.petit_sot_commissions (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  status text not null default 'new' check (status in ('new','reviewing','approved','awaiting_deposit','deposit_paid','in_progress','drying','ready_to_ship','shipped','completed','declined','cancelled')),
  customer_name text not null,
  customer_email text not null,
  customer_country text,
  description text not null,
  requested_style text not null default 'Olga Trikhleb oil painting',
  palette text,
  complexity text not null default 'medium' check (complexity in ('simple','medium','detailed')),
  width_cm numeric(7,2) not null check (width_cm between 20 and 200),
  height_cm numeric(7,2) not null check (height_cm between 20 and 200),
  medium text not null default 'Oil on canvas',
  reference_image_path text,
  preview_image_path text,
  estimated_price_eur numeric(10,2) not null default 0,
  final_price_eur numeric(10,2),
  deposit_amount_eur numeric(10,2),
  balance_amount_eur numeric(10,2),
  estimated_days_min integer not null default 35,
  estimated_days_max integer not null default 56,
  artist_notes text,
  paypal_order_id text,
  paypal_capture_id text,
  deposit_paid_at timestamptz,
  certificate_number text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists petit_sot_commissions_created_at_idx
  on public.petit_sot_commissions (created_at desc);
create index if not exists petit_sot_commissions_status_idx
  on public.petit_sot_commissions (status, created_at desc);

alter table public.petit_sot_commissions enable row level security;

drop policy if exists petit_sot_admin_commissions on public.petit_sot_commissions;
create policy petit_sot_admin_commissions
  on public.petit_sot_commissions
  for all
  to authenticated
  using (
    exists (
      select 1 from public.petit_sot_admins a
      where a.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.petit_sot_admins a
      where a.user_id = (select auth.uid())
    )
  );

revoke all on public.petit_sot_commissions from anon;

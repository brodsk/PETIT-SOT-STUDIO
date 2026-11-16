create table if not exists public.petit_sot_print_orders (
  id uuid primary key default gen_random_uuid(),
  prodigi_order_id text not null unique,
  merchant_reference text,
  status_stage text not null default 'unknown',
  prodigi_created_at timestamptz,
  prodigi_updated_at timestamptz,
  callback_payload jsonb not null default '{}'::jsonb,
  last_callback_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists petit_sot_print_orders_status_idx
  on public.petit_sot_print_orders (status_stage, last_callback_at desc);

alter table public.petit_sot_print_orders enable row level security;
revoke all on public.petit_sot_print_orders from anon, authenticated;
grant select on public.petit_sot_print_orders to authenticated;

drop policy if exists petit_sot_admin_print_orders_select on public.petit_sot_print_orders;
create policy petit_sot_admin_print_orders_select
  on public.petit_sot_print_orders
  for select
  to authenticated
  using (exists (
    select 1 from public.petit_sot_admins a
    where a.user_id = (select auth.uid())
  ));

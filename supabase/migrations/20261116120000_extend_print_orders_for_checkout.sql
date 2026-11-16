alter table public.petit_sot_print_orders
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text,
  add column if not exists variant_id uuid references public.petit_sot_print_variants(id) on delete set null,
  add column if not exists artwork_id uuid references public.petit_sot_artworks(id) on delete set null,
  add column if not exists paid_amount_eur numeric(10,2),
  add column if not exists recipient jsonb not null default '{}'::jsonb,
  add column if not exists fulfillment_error text,
  add column if not exists submitted_to_prodigi_at timestamptz;

create unique index if not exists petit_sot_print_orders_paypal_order_id_uidx
  on public.petit_sot_print_orders(paypal_order_id)
  where paypal_order_id is not null;

create index if not exists petit_sot_print_orders_variant_id_idx
  on public.petit_sot_print_orders(variant_id);

comment on column public.petit_sot_print_orders.recipient is
  'Shipping recipient details required for fulfilment; access restricted to service role/admin.';

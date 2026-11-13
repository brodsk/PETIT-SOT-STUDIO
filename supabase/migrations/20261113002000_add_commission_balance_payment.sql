alter table public.petit_sot_commissions
  add column if not exists balance_paypal_order_id text,
  add column if not exists balance_paypal_capture_id text,
  add column if not exists balance_paid_at timestamptz;
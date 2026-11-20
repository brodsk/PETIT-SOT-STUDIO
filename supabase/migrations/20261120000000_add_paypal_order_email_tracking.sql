-- Manual migration: review and run in the Supabase SQL Editor.
-- No database changes are applied by the application deployment.

alter table public.petit_sot_orders
  add column if not exists paypal_order_id text,
  add column if not exists paypal_capture_id text,
  add column if not exists buyer_locale text not null default 'en',
  add column if not exists buyer_email_sent_at timestamptz,
  add column if not exists owner_email_sent_at timestamptz,
  add column if not exists buyer_email_claimed_at timestamptz,
  add column if not exists owner_email_claimed_at timestamptz,
  add column if not exists email_error text;

create unique index if not exists petit_sot_orders_paypal_order_id_uidx
  on public.petit_sot_orders (paypal_order_id);

create index if not exists petit_sot_orders_unsent_order_emails_idx
  on public.petit_sot_orders (created_at)
  where status = 'paid'
    and (buyer_email_sent_at is null or owner_email_sent_at is null);

comment on column public.petit_sot_orders.buyer_email_sent_at is
  'Timestamp when the buyer confirmation email was accepted by the email provider.';
comment on column public.petit_sot_orders.owner_email_sent_at is
  'Timestamp when the owner notification email was accepted by the email provider.';
comment on column public.petit_sot_orders.email_error is
  'Last non-PII transactional email delivery error.';

alter table public.petit_sot_artworks
  add column if not exists ebay_sku text,
  add column if not exists ebay_offer_id text,
  add column if not exists ebay_listing_id text,
  add column if not exists ebay_state text,
  add column if not exists ebay_error text,
  add column if not exists ebay_synced_at timestamptz,
  add column if not exists ebay_listing_url text,
  add column if not exists sold_platform text,
  add column if not exists sold_order_id text,
  add column if not exists sold_at timestamptz;

create unique index if not exists petit_sot_artworks_ebay_sku_unique
  on public.petit_sot_artworks (ebay_sku) where ebay_sku is not null;
create unique index if not exists petit_sot_artworks_ebay_offer_id_unique
  on public.petit_sot_artworks (ebay_offer_id) where ebay_offer_id is not null;
create unique index if not exists petit_sot_artworks_ebay_listing_id_unique
  on public.petit_sot_artworks (ebay_listing_id) where ebay_listing_id is not null;

create table if not exists public.petit_sot_marketplace_events (
  id bigint generated always as identity primary key,
  marketplace text not null check (marketplace in ('etsy','ebay')),
  event_id text not null,
  event_type text not null,
  resource_id text,
  status text not null default 'received' check (status in ('received','processing','processed','error','conflict')),
  error text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (marketplace, event_id)
);

alter table public.petit_sot_marketplace_events enable row level security;

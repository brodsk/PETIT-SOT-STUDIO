alter table public.petit_sot_commissions
  add column if not exists final_artwork_title text,
  add column if not exists final_image_path text,
  add column if not exists final_year integer,
  add column if not exists final_medium text not null default 'Oil on canvas';
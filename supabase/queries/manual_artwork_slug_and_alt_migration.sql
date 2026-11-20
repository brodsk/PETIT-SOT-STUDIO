-- MANUAL / NOT APPLIED
-- Run only after reviewing the affected rows and confirming no slug collisions.
begin;

alter table public.petit_sot_artwork_images
  add column if not exists alt_en text,
  add column if not exists alt_ru text,
  add column if not exists alt_sk text;

update public.petit_sot_artworks
set slug = case slug
  when 'Meadow' then 'meadow'
  when 'Anthuriums' then 'anthuriums'
  when 'storm_light' then 'storm-light'
  when 'Nice' then 'nice'
  when 'Evening' then 'evening'
  when 'Mallorca' then 'mallorca'
  else slug
end
where slug in ('Meadow', 'Anthuriums', 'storm_light', 'Nice', 'Evening', 'Mallorca');

commit;

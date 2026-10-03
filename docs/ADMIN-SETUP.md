# PETIT.SOT STUDIO — admin setup

The CMS is connected to the Supabase project used for this site.

## 1. Add environment variables to the deployment

Set:

NEXT_PUBLIC_SUPABASE_URL=https://xtxqslzublggqhctmjoa.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Ug8pIIkWhJ-EGExLQ_ggv37B99

For AI descriptions also set:

OPENAI_API_KEY=your_key
OPENAI_VISION_MODEL=gpt-6-luna

Never expose OPENAI_API_KEY in a NEXT_PUBLIC_ variable.

## 2. Create the admin login

In Supabase Dashboard → Authentication → Users, create the email/password user that should access /admin.

Then copy that user's UUID and run this SQL in the Supabase SQL editor:

insert into public.petit_sot_admins (user_id)
values ('YOUR_AUTH_USER_UUID')
on conflict do nothing;

Only users present in petit_sot_admins can access the CMS or upload artwork files.

## 3. CMS

Open /admin.

You can:
- upload JPG / PNG / WEBP artwork images;
- set title, slug, year, medium and dimensions;
- set the price directly in EUR;
- choose draft / available / sold / archived;
- ask the vision model to write a catalogue description from the actual artwork image;
- edit the generated description before publishing;
- generate an artwork passport / certificate PDF.

## 4. Orders

Open /admin/orders.

The order table is ready for Stripe checkout. Stripe checkout/webhooks are intentionally the next step so no fake payment flow is introduced.

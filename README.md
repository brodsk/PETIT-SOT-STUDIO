# PETIT.SOT STUDIO

Official gallery and commerce website for artist Olga Trikhleb. The site presents original paintings and fine-art prints, supports artwork enquiries and commissions, and provides an admin area for artwork management and marketplace workflows.

## Stack

- Next.js 15 App Router
- React 19 and TypeScript
- Supabase (Postgres, Auth, Storage)
- Vercel deployments
- PayPal checkout, Etsy/eBay marketplace integrations, SAShE outbound listings
- Cloudflare Turnstile and email/Telegram contact notifications
- Google Gemini and Hugging Face inference for selected admin tools

## Project structure

- `app/[locale]/` — localized public routes for English, Russian and Slovak.
- `app/[locale]/works/` — artwork archive and individual artwork pages.
- `app/[locale]/wall-preview/` — photo-based room preview.
- `app/admin/` — authenticated admin interface.
- `app/api/` — server route handlers and integration callbacks.
- `lib/works.ts` — artwork model, Supabase reads and localized medium labels.
- `lib/supabase/` — browser, server and privileged Supabase clients.
- `data/works.ts` — public artwork model re-export.
- `middleware.ts` — locale routing, legacy path handling and canonical slug redirects.
- `supabase/migrations/` — database migrations.
- `supabase/queries/` — manually reviewed SQL scripts and operational queries.

## Environment variables

Create `.env.local` for local development. Add secrets in Vercel Project Settings → Environment Variables for deployed environments. Never prefix server secrets with `NEXT_PUBLIC_`.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL` — project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable browser/server key.
- `SUPABASE_SERVICE_ROLE_KEY` — privileged server-only key; never expose to client components.

### AI and artwork tools

- `GEMINI_API_KEY` — Gemini API key for artwork title/description and certificate workflows.
- `GEMINI_MODEL` — optional model override.
- `HF_TOKEN` — Hugging Face token for admin interior-generation endpoint.

### Contact and anti-abuse

- `TURNSTILE_SECRET_KEY` — server-side Cloudflare Turnstile secret.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public Turnstile site key.
- `RESEND_API_KEY` — legacy key used by the existing contact-email helper.
- `CONTACT_FROM_EMAIL` — legacy sender address used by the existing contact-email helper.

### Transactional order email

Order confirmations and owner notifications use the existing Resend provider through the server-only adapter in `lib/email/send.ts` (Resend HTTP API; no additional browser SDK).

- `EMAIL_API_KEY` — Resend API key (server-only).
- `EMAIL_FROM` — verified sender, e.g. `PETIT.SOT STUDIO <orders@petitsot.com>`.
- `EMAIL_REPLY_TO` — reply-to address for order correspondence.
- `OWNER_NOTIFY_EMAIL` — studio inbox for new-order notifications.
- `EMAIL_RETRY_SECRET` — long random secret required by `POST /api/email/retry`.

The legacy `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` remain supported as fallbacks by the existing contact flow and email adapter.

After running `supabase/migrations/20261120000000_add_paypal_order_email_tracking.sql`, the PayPal capture route persists the confirmed original-artwork order in `petit_sot_orders` and attempts both emails. Email failures do not change the successful payment response. The retry endpoint accepts `Authorization: Bearer <EMAIL_RETRY_SECRET>` and either `{ "orderId": "<uuid>" }` or an empty JSON body to process up to 25 oldest paid orders with missing email timestamps.

In local development, open `/dev/email-preview` to preview buyer messages in EN/RU/SK and the owner message in RU. It uses fixtures only and never sends mail.

Shipping copy is deliberately marked TODO in `lib/email/order-templates.ts`; replace it only after the studio confirms the actual shipping terms.

### PayPal Sandbox test for original-artwork order emails

1. In the PayPal Developer Dashboard, use a sandbox business account as the merchant and a separate sandbox personal account as the buyer.
2. Set `PAYPAL_ENVIRONMENT=sandbox`, `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` to the sandbox app credentials in local `.env.local` or a Vercel Preview environment.
3. Configure `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `OWNER_NOTIFY_EMAIL` and a strong `EMAIL_RETRY_SECRET`. The sender domain must be verified with Resend before sending to arbitrary recipients.
4. Run the SQL migration above manually before testing. Use an available artwork with a valid EUR price, open its page in EN, RU or SK, and complete checkout with the sandbox buyer.
5. After returning to `/checkout/success`, verify that `petit_sot_orders` contains one `paid` row with `paypal_order_id`, `paypal_capture_id`, buyer details and `buyer_locale`. Check that both email sent timestamps are set and both messages arrived.
6. Repeat the capture request for the same PayPal order ID. The order row must remain unique and the provider idempotency keys plus database claims must prevent duplicate messages.
7. To test recovery, temporarily make one email destination/provider setting invalid, complete another sandbox order, and verify the payment still displays as successful while `email_error` is populated and the failed message's sent timestamp remains null. Restore the correct settings and call `POST /api/email/retry` with `Authorization: Bearer <EMAIL_RETRY_SECRET>` and JSON `{ "orderId": "<order-uuid>" }`. Verify that only the unsent message is delivered.

No live PayPal transaction or real customer email is needed for this test.
- `TELEGRAM_BOT_TOKEN` — Telegram bot token for contact notifications.
- `TELEGRAM_CHAT_ID` — primary notification chat.
- `TELEGRAM_ADDITIONAL_CHAT_IDS` — optional comma-separated additional chats.

### Marketplace and fulfilment integrations

- `ETSY_API_KEYSTRING`
- `ETSY_SHARED_SECRET`
- `ETSY_REDIRECT_URI`
- `EBAY_CLIENT_ID`
- `EBAY_CLIENT_SECRET`
- `EBAY_REFRESH_TOKEN`
- `EBAY_RUNAME`
- `EBAY_NOTIFICATION_VERIFICATION_TOKEN`
- `EBAY_ACCOUNT_DELETION_VERIFICATION_TOKEN`
- `ETSY_WEBHOOK_SIGNING_SECRET`
- `PRODIGI_API_KEY`

### PayPal

- `PAYPAL_ENVIRONMENT`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`

Use the exact callback URLs configured in the corresponding provider dashboards. Some integrations also persist OAuth tokens in restricted Supabase tables rather than environment variables. Keep production and preview credentials separated.

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. If `.env.example` is not present in the current checkout, create `.env.local` manually using the variable names above.

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy to Vercel

1. Import the GitHub repository `brodsk/PETIT-SOT-STUDIO` into Vercel.
2. Configure the environment variables for Production and Preview separately.
3. Set the production domain to `https://www.petitsot.com` and configure the apex-domain redirect consistently.
4. Deploy the `main` branch. Pull requests should use Vercel Preview deployments and the GitHub Actions CI workflow.
5. After deployment, verify localized routes, artwork pages, checkout, marketplace callbacks and the generated sitemap.

Vercel-hosted `.vercel.app` hosts receive an `X-Robots-Tag: noindex, nofollow` response header from middleware; the custom production domain remains indexable.

## Supabase overview

The public schema currently includes:

- `petit_sot_artworks` — artwork records, titles, prices, status, dimensions and primary image paths.
- `petit_sot_artwork_images` — additional artwork gallery images and optional localized image alt text.
- `petit_sot_artwork_interiors` — generated interior mockups.
- `petit_sot_admins` — allow-list of admin user IDs.
- `petit_sot_orders`, `petit_sot_print_orders` — order and fulfilment records.
- `petit_sot_print_variants` — available print formats and prices.
- `petit_sot_commissions` — commission requests and payment/proposal state.
- Marketplace connection/event tables — Etsy, Pinterest and eBay synchronization.
- Other application tables — bot state/events, contact/CRM and AI rate-limit usage.

Artwork images are stored in the `petit-sot-artworks` Storage bucket. Public read policies are intended for published artwork assets; admin mutations are restricted to users listed in `petit_sot_admins`. Order, commission and provider-token data must remain server/admin-only.

Review every SQL migration before applying it. RLS is enabled on the currently inspected public tables. Some service-only tables intentionally have no client-facing policies; do not add broad `anon` or `authenticated` policies merely to silence the Supabase advisor. Match each policy to the actual server-side access model.

## CI

GitHub Actions runs lint, TypeScript typecheck and `next build` on pull requests and pushes to `main`. The repository currently has no committed npm lockfile, so the workflow uses `npm install`; add and commit a lockfile to make CI dependency resolution reproducible.

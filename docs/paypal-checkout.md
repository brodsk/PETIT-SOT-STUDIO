# PayPal Checkout setup

This feature adds server-side PayPal order creation and capture plus return/cancel pages.

## Vercel environment variables

Set these for the Preview environment first:

- `PAYPAL_CLIENT_ID` — PayPal REST app Client ID
- `PAYPAL_CLIENT_SECRET` — PayPal REST app Secret; server-only, never prefix with `NEXT_PUBLIC_`
- `PAYPAL_ENVIRONMENT` — `sandbox` for testing or `live` for real payments

After the Preview flow is tested end-to-end, add the production credentials to Production. Do not use a credential that has been posted in chat; replace it in PayPal first.

## Endpoints

- `POST /api/paypal/create-order` with JSON `{"slug":"artwork-slug"}`: reads the current price and availability from Supabase and returns `approveUrl`.
- `POST /api/paypal/capture-order` with JSON `{"orderId":"PAYPAL_ORDER_ID"}`: verifies order status, artwork slug, currency and amount with PayPal before capture.
- `/checkout/success`: attempts capture and displays success only after PayPal confirms `COMPLETED`.
- `/checkout/cancel`: cancellation return page.

The artwork detail page includes a PayPal checkout button for available works with a positive price. Existing Etsy/SAShE/contact options remain available.

## Before production

1. Rotate any credential previously shared in chat and store the replacement only in Vercel Environment Variables.
2. Test with PayPal Sandbox credentials in Preview.
3. Verify successful payment, cancellation, unavailable artwork, mismatched amount, and duplicate capture behavior.
4. Configure Live credentials in Production only after tests pass.

Note: this initial checkout implementation does not yet persist orders in a dedicated order table, reserve artwork against concurrent purchases, or automatically mark a work as sold. Add persistent order records and inventory locking before relying on it for high-demand or one-of-a-kind works.

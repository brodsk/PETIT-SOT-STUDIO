import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function paypalBaseUrl() {
  return process.env.PAYPAL_ENVIRONMENT === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured");
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("PayPal authentication failed");
  return (await response.json()).access_token as string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const variantId = typeof body?.variantId === "string" ? body.variantId : "";
    const countryCode = typeof body?.countryCode === "string" ? body.countryCode.trim().toUpperCase() : "";
    if (!/^[0-9a-f-]{36}$/i.test(variantId) || !/^[A-Z]{2}$/.test(countryCode)) {
      return NextResponse.json({ error: "Choose a valid print size and delivery country." }, { status: 400 });
    }

    const apiKey = process.env.PRODIGI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: "Print fulfilment is not configured." }, { status: 503 });

    const supabase = await createClient();
    const { data: variant, error } = await supabase.from("petit_sot_print_variants")
      .select("id,artwork_id,prodigi_sku,retail_price_eur,active")
      .eq("id", variantId).eq("active", true).maybeSingle();
    if (error || !variant) return NextResponse.json({ error: "This print size is not available." }, { status: 404 });

    const quoteResponse = await fetch("https://api.prodigi.com/v4.0/quotes", {
      method: "POST",
      headers: { "X-API-Key": apiKey, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingMethod: "Standard",
        destinationCountryCode: countryCode,
        currencyCode: "EUR",
        items: [{ sku: variant.prodigi_sku, copies: 1, assets: [{ printArea: "default" }] }],
      }),
      cache: "no-store",
    });
    const quoteBody = await quoteResponse.json().catch(() => ({}));
    if (!quoteResponse.ok) {
      console.error("Prodigi checkout quote failed", quoteResponse.status);
      return NextResponse.json({ error: "We could not calculate delivery for this country. Please contact us." }, { status: 422 });
    }
    const quote = (quoteBody.quotes || []).find((item: any) => String(item.shipmentMethod).toLowerCase() === "standard");
    const shipping = Number(quote?.costSummary?.shipping?.amount);
    const quoteCurrency = quote?.costSummary?.shipping?.currency || quote?.costSummary?.items?.currency;
    if (!quote || !Number.isFinite(shipping) || shipping < 0 || quoteCurrency !== "EUR") {
      return NextResponse.json({ error: "Prodigi did not return a valid EUR delivery quote for this country." }, { status: 422 });
    }

    const retail = Number(variant.retail_price_eur);
    const total = Math.round((retail + shipping) * 100) / 100;
    if (!Number.isFinite(retail) || retail <= 0 || total <= 0 || total > 10000) {
      return NextResponse.json({ error: "The print price is not configured correctly." }, { status: 409 });
    }

    const accessToken = await getPayPalAccessToken();
    const origin = new URL(request.url).origin;
    const paypalResponse = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "PayPal-Request-Id": crypto.randomUUID() },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: variantId,
          custom_id: variantId,
          description: "PETIT.SOT Fine Art Print",
          amount: {
            currency_code: "EUR",
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: "EUR", value: retail.toFixed(2) },
              shipping: { currency_code: "EUR", value: shipping.toFixed(2) },
            },
          },
        }],
        application_context: {
          brand_name: "PETIT.SOT STUDIO",
          user_action: "PAY_NOW",
          shipping_preference: "GET_FROM_FILE",
          return_url: `${origin}/checkout/print-success`,
          cancel_url: `${origin}/checkout/print-cancel`,
        },
      }),
      cache: "no-store",
    });
    const order = await paypalResponse.json().catch(() => ({}));
    if (!paypalResponse.ok || !order.id) {
      console.error("PayPal print order creation failed", paypalResponse.status, order?.name);
      return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ orderId: order.id, amount: total.toFixed(2), currency: "EUR", itemPrice: retail.toFixed(2), shipping: shipping.toFixed(2) });
  } catch (error) {
    console.error("Print checkout creation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

function paypalBaseUrl() {
  return process.env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured");

  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("PayPal authentication failed");
  const data = await response.json();
  return data.access_token as string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    const paymentMethod = body?.paymentMethod === "googlepay" ? "googlepay" : null;
    if (body?.paymentMethod !== undefined && body.paymentMethod !== "googlepay") {
      return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 });
    }
    if (!slug || slug.length > 120 || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return NextResponse.json({ error: "Invalid artwork" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: artwork, error } = await supabase
      .from("petit_sot_artworks")
      .select("slug,title,title_en,price_eur,status")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Could not load artwork" }, { status: 500 });
    }
    if (!artwork || artwork.status !== "available") {
      return NextResponse.json({ error: "This artwork is not available for purchase" }, { status: 409 });
    }

    const price = Number(artwork.price_eur);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Invalid artwork price" }, { status: 409 });
    }

    const accessToken = await getPayPalAccessToken();
    const origin = new URL(request.url).origin;
    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": crypto.randomUUID(),
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: artwork.slug,
          custom_id: artwork.slug,
          description: String(artwork.title_en || artwork.title || artwork.slug).slice(0, 127),
          amount: { currency_code: "EUR", value: price.toFixed(2) },
        }],
        ...(paymentMethod === "googlepay" ? {
          payment_source: {
            google_pay: {
              attributes: {
                verification: { method: "SCA_WHEN_REQUIRED" },
              },
            },
          },
        } : {}),
        application_context: {
          brand_name: "PETIT.SOT STUDIO",
          user_action: "PAY_NOW",
          return_url: `${origin}/checkout/success`,
          cancel_url: `${origin}/checkout/cancel`,
        },
      }),
      cache: "no-store",
    });

    const order = await response.json();
    if (!response.ok) {
      console.error("PayPal create order failed", response.status, order?.name);
      return NextResponse.json({ error: "Could not start PayPal checkout" }, { status: 502 });
    }

    const approveUrl = order.links?.find((link: { rel?: string }) => link.rel === "approve")?.href;
    if (!order.id || !approveUrl) {
      return NextResponse.json({ error: "PayPal did not return an approval link" }, { status: 502 });
    }

    return NextResponse.json({ orderId: order.id, approveUrl });
  } catch (error) {
    console.error("PayPal create order error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Payment service is not configured yet" }, { status: 503 });
  }
}

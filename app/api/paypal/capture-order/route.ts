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
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId || orderId.length > 80 || !/^[A-Z0-9]+$/i.test(orderId)) {
      return NextResponse.json({ error: "Invalid PayPal order" }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = paypalBaseUrl();

    // Verify the order with PayPal before attempting capture.
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const order = await orderResponse.json();
    if (!orderResponse.ok) {
      return NextResponse.json({ error: "Could not verify PayPal order" }, { status: 400 });
    }
    if (order.status === "COMPLETED") {
      return NextResponse.json({ status: "COMPLETED", orderId: order.id });
    }
    if (order.status !== "APPROVED") {
      return NextResponse.json({ error: "PayPal order has not been approved" }, { status: 409 });
    }

    const unit = order.purchase_units?.[0];
    const slug = unit?.reference_id;
    if (typeof slug !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(slug)) {
      return NextResponse.json({ error: "Order does not match an artwork" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: artwork, error } = await supabase
      .from("petit_sot_artworks")
      .select("slug,price_eur,status")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Could not verify artwork" }, { status: 500 });
    }
    if (!artwork || artwork.status !== "available") {
      return NextResponse.json({ error: "This artwork is no longer available" }, { status: 409 });
    }

    const expectedValue = Number(artwork.price_eur);
    const paidCurrency = unit?.amount?.currency_code;
    const paidValue = Number(unit?.amount?.value);
    if (!Number.isFinite(expectedValue) || expectedValue <= 0 ||
        paidCurrency !== "EUR" || !Number.isFinite(paidValue) ||
        Math.abs(paidValue - expectedValue) > 0.001) {
      return NextResponse.json({ error: "Order amount does not match the current artwork price" }, { status: 409 });
    }

    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `capture-${orderId}`,
      },
      body: "{}",
      cache: "no-store",
    });
    const capture = await captureResponse.json();
    if (!captureResponse.ok || capture.status !== "COMPLETED") {
      console.error("PayPal capture failed", captureResponse.status, capture?.name);
      return NextResponse.json({ error: "PayPal could not complete the payment" }, { status: 502 });
    }

    const captureDetails = capture.purchase_units?.[0]?.payments?.captures?.[0];
    return NextResponse.json({
      status: "COMPLETED",
      orderId: capture.id,
      captureId: captureDetails?.id ?? null,
      amount: captureDetails?.amount ?? unit.amount,
    });
  } catch (error) {
    console.error("PayPal capture error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Payment service is not configured yet" }, { status: 503 });
  }
}

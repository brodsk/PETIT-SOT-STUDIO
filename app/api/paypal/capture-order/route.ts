import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { sendOrderEmails } from "../../../../lib/email/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function clean(value: unknown, max = 180): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function getBuyerLocale(request: Request): "en" | "ru" | "sk" {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  let value = "";
  try { value = match ? decodeURIComponent(match[1]) : ""; } catch { value = ""; }
  return value === "ru" || value === "sk" ? value : "en";
}

function getCapture(order: any) {
  const captures = order?.purchase_units?.flatMap((unit: any) => unit?.payments?.captures || []) || [];
  return captures.find((item: any) => item.status === "COMPLETED") || captures[0] || null;
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

    // Verify the order with PayPal before capture or post-capture processing.
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const verifiedOrder = await orderResponse.json();
    if (!orderResponse.ok) {
      return NextResponse.json({ error: "Could not verify PayPal order" }, { status: 400 });
    }
    if (verifiedOrder.status !== "COMPLETED" && verifiedOrder.status !== "APPROVED") {
      return NextResponse.json({ error: "PayPal order has not been approved" }, { status: 409 });
    }

    const unit = verifiedOrder.purchase_units?.[0];
    const slug = unit?.reference_id;
    if (typeof slug !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(slug)) {
      return NextResponse.json({ error: "Order does not match an artwork" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: artwork, error } = await supabase
      .from("petit_sot_artworks")
      .select("id,slug,title,title_en,title_sk,price_eur,status,year,medium,width_cm,height_cm,image_path,web_image_path,thumbnail_path")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Could not verify artwork" }, { status: 500 });
    }
    if (!artwork || (verifiedOrder.status !== "COMPLETED" && artwork.status !== "available")) {
      return NextResponse.json({ error: "This artwork is no longer available" }, { status: 409 });
    }

    const paidCurrency = unit?.amount?.currency_code;
    const paidValue = Number(unit?.amount?.value);
    if (paidCurrency !== "EUR" || !Number.isFinite(paidValue) || paidValue <= 0) {
      return NextResponse.json({ error: "Order amount or currency is invalid" }, { status: 409 });
    }

    // Before capture, verify the amount against the current server-side artwork price.
    // For an already-completed PayPal order, use PayPal's confirmed paid amount so a later
    // catalogue price edit cannot prevent the email retry path from completing.
    if (verifiedOrder.status === "APPROVED") {
      const expectedValue = Number(artwork.price_eur);
      if (!Number.isFinite(expectedValue) || expectedValue <= 0 || Math.abs(paidValue - expectedValue) > 0.001) {
        return NextResponse.json({ error: "Order amount does not match the current artwork price" }, { status: 409 });
      }
    }

    let completedOrder = verifiedOrder;
    if (verifiedOrder.status !== "COMPLETED") {
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
      const captureResult = await captureResponse.json();
      if (!captureResponse.ok || captureResult.status !== "COMPLETED") {
        console.error("PayPal capture failed", captureResponse.status, captureResult?.name);
        return NextResponse.json({ error: "PayPal could not complete the payment" }, { status: 502 });
      }
      completedOrder = {
        ...verifiedOrder,
        ...captureResult,
        payer: captureResult.payer || verifiedOrder.payer,
        purchase_units: captureResult.purchase_units?.length ? captureResult.purchase_units : verifiedOrder.purchase_units,
      };
    }

    // Everything below this point is post-payment. Failures here must never turn a
    // confirmed PayPal payment into a checkout error.
    const capture = getCapture(completedOrder);
    const payer = completedOrder.payer || verifiedOrder.payer || {};
    const paidUnit = completedOrder.purchase_units?.[0] || unit;
    const shipping = paidUnit?.shipping || unit?.shipping || {};
    const address = shipping.address || {};
    const buyerName = clean(
      shipping.name?.full_name ||
      [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(" "),
      180,
    );
    const buyerEmail = clean(payer.email_address, 254).toLowerCase();
    const buyerPhone = clean(payer.phone?.phone_number?.national_number, 40);
    const shippingAddress = {
      name: buyerName,
      line1: clean(address.address_line_1, 180),
      line2: clean(address.address_line_2, 180),
      city: clean(address.admin_area_2, 100),
      state: clean(address.admin_area_1, 100),
      postal_code: clean(address.postal_code, 40),
      country_code: clean(address.country_code, 2).toUpperCase(),
    };
    const captureAmount = capture?.amount?.value || paidUnit?.amount?.value || unit?.amount?.value;
    const amount = Number(captureAmount);
    const currency = clean(capture?.amount?.currency_code || paidUnit?.amount?.currency_code || paidCurrency, 3).toUpperCase();

    try {
      const db = createAdminClient();
      const { error: saveError } = await db.from("petit_sot_orders").upsert({
        artwork_id: artwork.id,
        status: "paid",
        buyer_name: buyerName || null,
        buyer_email: buyerEmail || null,
        buyer_phone: buyerPhone || null,
        amount_eur: Number.isFinite(amount) ? amount : paidValue,
        currency: currency || "EUR",
        shipping_address: shippingAddress,
        paypal_order_id: orderId,
        paypal_capture_id: capture?.id || null,
        buyer_locale: getBuyerLocale(request),
        updated_at: new Date().toISOString(),
      }, { onConflict: "paypal_order_id", ignoreDuplicates: true });

      if (saveError) {
        console.error("Paid PayPal order could not be saved for email processing", {
          paypalOrderId: orderId,
          code: saveError.code || "database_error",
        });
        return NextResponse.json({
          status: "COMPLETED",
          orderId: completedOrder.id || orderId,
          captureId: capture?.id ?? null,
          amount: capture?.amount ?? paidUnit?.amount ?? unit?.amount,
          recordWarning: true,
        });
      }

      const { data: savedOrder, error: loadError } = await db.from("petit_sot_orders")
        .select("id").eq("paypal_order_id", orderId).maybeSingle();
      if (loadError || !savedOrder?.id) {
        console.error("Paid PayPal order record could not be reloaded", {
          paypalOrderId: orderId,
          code: loadError?.code || "order_not_found",
        });
      } else {
        try {
          await sendOrderEmails(savedOrder.id);
        } catch (emailError) {
          console.error("Post-payment email processing failed", {
            orderId: savedOrder.id,
            reason: emailError instanceof Error ? emailError.message.slice(0, 120) : "Unknown error",
          });
        }
      }
    } catch (saveError) {
      console.error("Post-payment order persistence failed", {
        paypalOrderId: orderId,
        reason: saveError instanceof Error ? saveError.message.slice(0, 120) : "Unknown error",
      });
    }

    return NextResponse.json({
      status: "COMPLETED",
      orderId: completedOrder.id || orderId,
      captureId: capture?.id ?? null,
      amount: capture?.amount ?? paidUnit?.amount ?? unit?.amount,
    });
  } catch (error) {
    console.error("PayPal capture error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Payment service is not configured yet" }, { status: 503 });
  }
}

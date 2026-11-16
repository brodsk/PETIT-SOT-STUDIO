import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

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

function clean(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId || orderId.length > 80 || !/^[A-Z0-9]+$/i.test(orderId)) {
      return NextResponse.json({ error: "Invalid PayPal order." }, { status: 400 });
    }

    const apiKey = process.env.PRODIGI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: "Print fulfilment is not configured." }, { status: 503 });

    const accessToken = await getPayPalAccessToken();
    const baseUrl = paypalBaseUrl();
    const verifyResponse = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const verified = await verifyResponse.json().catch(() => ({}));
    if (!verifyResponse.ok) return NextResponse.json({ error: "Could not verify PayPal payment." }, { status: 400 });

    const unit = verified.purchase_units?.[0];
    const variantId = clean(unit?.custom_id, 80);
    if (!/^[0-9a-f-]{36}$/i.test(variantId)) return NextResponse.json({ error: "This payment is not a PETIT.SOT print order." }, { status: 400 });

    const db = createAdminClient();
    const { data: existing } = await db.from("petit_sot_print_orders")
      .select("prodigi_order_id,status_stage")
      .eq("paypal_order_id", orderId).maybeSingle();
    if (existing?.prodigi_order_id) {
      return NextResponse.json({ status: "COMPLETED", prodigiOrderId: existing.prodigi_order_id });
    }

    if (verified.status !== "COMPLETED" && verified.status !== "APPROVED") {
      return NextResponse.json({ error: "PayPal payment has not been approved." }, { status: 409 });
    }

    const { data: variant, error: variantError } = await db.from("petit_sot_print_variants")
      .select("id,artwork_id,prodigi_sku,retail_price_eur,active")
      .eq("id", variantId).maybeSingle();
    if (variantError || !variant || !variant.active) return NextResponse.json({ error: "This print size is no longer available." }, { status: 409 });

    const paidCurrency = unit?.amount?.currency_code;
    const paidTotal = Number(unit?.amount?.value);
    const itemTotal = Number(unit?.amount?.breakdown?.item_total?.value);
    const paidShipping = Number(unit?.amount?.breakdown?.shipping?.value);
    const expectedItem = Number(variant.retail_price_eur);
    if (paidCurrency !== "EUR" || !Number.isFinite(paidTotal) || !Number.isFinite(itemTotal) ||
        !Number.isFinite(paidShipping) || paidShipping < 0 ||
        Math.abs(itemTotal - expectedItem) > 0.001 ||
        Math.abs(paidTotal - itemTotal - paidShipping) > 0.001) {
      return NextResponse.json({ error: "Payment amount does not match this print." }, { status: 409 });
    }

    let completedOrder = verified;
    if (verified.status !== "COMPLETED") {
      const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "PayPal-Request-Id": `capture-${orderId}` },
        body: "{}",
        cache: "no-store",
      });
      completedOrder = await captureResponse.json().catch(() => ({}));
      if (!captureResponse.ok || completedOrder.status !== "COMPLETED") {
        console.error("PayPal print capture failed", captureResponse.status, completedOrder?.name);
        return NextResponse.json({ error: "PayPal could not complete the payment." }, { status: 502 });
      }
    }

    const capture = completedOrder.purchase_units?.[0]?.payments?.captures?.[0];
    const payerEmail = clean(completedOrder.payer?.email_address, 254);
    const payerPhone = clean(completedOrder.payer?.phone?.phone_number?.national_number, 40);
    const shipping = completedOrder.purchase_units?.[0]?.shipping || unit?.shipping;
    const address = shipping?.address || {};
    const recipient = {
      name: clean(shipping?.name?.full_name || completedOrder.payer?.name?.given_name, 180),
      email: payerEmail || null,
      phoneNumber: payerPhone || null,
      address: {
        line1: clean(address.address_line_1, 180),
        line2: clean(address.address_line_2, 180),
        postalOrZipCode: clean(address.postal_code, 40),
        countryCode: clean(address.country_code, 2).toUpperCase(),
        townOrCity: clean(address.admin_area_2, 100),
        stateOrCounty: clean(address.admin_area_1, 100) || null,
      },
    };
    if (!recipient.name || !recipient.address.line1 || !recipient.address.postalOrZipCode ||
        !/^[A-Z]{2}$/.test(recipient.address.countryCode) || !recipient.address.townOrCity) {
      await db.from("petit_sot_print_orders").upsert({
        paypal_order_id: orderId,
        paypal_capture_id: capture?.id || null,
        variant_id: variant.id,
        artwork_id: variant.artwork_id,
        paid_amount_eur: paidTotal,
        status_stage: "paid_address_incomplete",
        recipient,
        callback_payload: { source: "paypal", fulfillment: "pending_address_review" },
        last_callback_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "paypal_order_id" });
      return NextResponse.json({ status: "PENDING", message: "Payment received. The delivery address needs manual review." });
    }

    const { data: artwork, error: artworkError } = await db.from("petit_sot_artworks")
      .select("id,slug,title,image_path,web_image_path")
      .eq("id", variant.artwork_id).maybeSingle();
    if (artworkError || !artwork || !artwork.image_path) {
      await db.from("petit_sot_print_orders").upsert({
        paypal_order_id: orderId, paypal_capture_id: capture?.id || null,
        variant_id: variant.id, artwork_id: variant.artwork_id, paid_amount_eur: paidTotal,
        status_stage: "paid_artwork_asset_missing", recipient,
        callback_payload: { source: "paypal", fulfillment: "manual_review" },
        last_callback_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }, { onConflict: "paypal_order_id" });
      return NextResponse.json({ status: "PENDING", message: "Payment received. The artwork file needs manual review before production." });
    }

    const imageUrl = db.storage.from("petit-sot-artworks").getPublicUrl(artwork.image_path).data.publicUrl;
    if (!imageUrl || !imageUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Artwork file is not publicly available for fulfilment." }, { status: 502 });
    }

    const prodigiPayload = {
      merchantReference: `PETITSOT-${orderId}`,
      idempotencyKey: `petitsot-${orderId}`,
      callbackUrl: "https://www.petitsot.com/api/webhooks/prodigi",
      shippingMethod: "Standard",
      recipient,
      items: [{
        merchantReference: variant.id,
        sku: variant.prodigi_sku,
        copies: 1,
        sizing: "fitPrintArea",
        recipientCost: { amount: expectedItem.toFixed(2), currency: "EUR" },
        assets: [{ printArea: "default", url: imageUrl }],
      }],
    };

    const prodigiResponse = await fetch("https://api.prodigi.com/v4.0/Orders", {
      method: "POST",
      headers: { "X-API-Key": apiKey, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(prodigiPayload),
      cache: "no-store",
    });
    const prodigiBody = await prodigiResponse.json().catch(() => ({}));
    const prodigiOrder = prodigiBody?.order;
    if (!prodigiResponse.ok || !prodigiOrder?.id) {
      console.error("Paid print order could not be submitted to Prodigi", prodigiResponse.status, prodigiBody?.outcome);
      await db.from("petit_sot_print_orders").upsert({
        paypal_order_id: orderId,
        paypal_capture_id: capture?.id || null,
        variant_id: variant.id,
        artwork_id: variant.artwork_id,
        paid_amount_eur: paidTotal,
        status_stage: "paid_fulfillment_pending",
        recipient,
        fulfillment_error: `Prodigi API returned HTTP ${prodigiResponse.status}`,
        callback_payload: { source: "paypal", fulfillment: "retry_required" },
        last_callback_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "paypal_order_id" });
      return NextResponse.json({ status: "PENDING", message: "Payment received. Production submission is delayed; PETIT.SOT will process the order shortly." });
    }

    const now = new Date().toISOString();
    const { error: saveError } = await db.from("petit_sot_print_orders").upsert({
      prodigi_order_id: prodigiOrder.id,
      paypal_order_id: orderId,
      paypal_capture_id: capture?.id || null,
      merchant_reference: prodigiOrder.merchantReference || `PETITSOT-${orderId}`,
      variant_id: variant.id,
      artwork_id: variant.artwork_id,
      paid_amount_eur: paidTotal,
      status_stage: prodigiOrder.status?.stage || "InProgress",
      recipient,
      prodigi_created_at: prodigiOrder.created || null,
      prodigi_updated_at: prodigiOrder.lastUpdated || null,
      callback_payload: { source: "paypal", fulfillment: "submitted" },
      last_callback_at: now,
      submitted_to_prodigi_at: now,
      fulfillment_error: null,
      updated_at: now,
    }, { onConflict: "paypal_order_id" });
    if (saveError) {
      console.error("Prodigi order created but local order record failed", saveError.code, prodigiOrder.id);
      return NextResponse.json({ status: "COMPLETED", prodigiOrderId: prodigiOrder.id, recordWarning: true });
    }

    return NextResponse.json({ status: "COMPLETED", prodigiOrderId: prodigiOrder.id });
  } catch (error) {
    console.error("Print payment capture/fulfilment error", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "We could not finish processing this print order. Please contact PETIT.SOT before retrying." }, { status: 503 });
  }
}

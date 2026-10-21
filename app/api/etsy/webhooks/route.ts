import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import {
  getArtworkForEtsyListing,
  markArtworkSold,
  recordMarketplaceEvent,
  updateMarketplaceEvent,
  etsyServerRequest,
} from "../../../../lib/marketplace-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, id: string, timestamp: string, signatureHeader: string, secret: string) {
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 12 * 60 * 60) return false;
  const encodedSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let key: Buffer;
  try {
    key = Buffer.from(encodedSecret, "base64");
  } catch {
    return false;
  }
  if (!key.length) return false;
  const signedContent = id + "." + timestamp + "." + rawBody;
  const expected = createHmac("sha256", key).update(signedContent).digest("base64");
  return signatureHeader.split(" ").some((entry) => {
    const parts = entry.split(",");
    if (parts.length !== 2 || parts[0] !== "v1") return false;
    const supplied = Buffer.from(parts[1]);
    const calculated = Buffer.from(expected);
    return supplied.length === calculated.length && timingSafeEqual(supplied, calculated);
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.ETSY_WEBHOOK_SIGNING_SECRET?.trim();
  const eventId = request.headers.get("webhook-id") || "";
  const timestamp = request.headers.get("webhook-timestamp") || "";
  const signature = request.headers.get("webhook-signature") || "";

  if (!secret) return NextResponse.json({ error: "Etsy webhook secret is not configured." }, { status: 503 });
  if (!eventId || !timestamp || !signature || !verifySignature(rawBody, eventId, timestamp, signature, secret)) {
    return NextResponse.json({ error: "Invalid Etsy webhook signature." }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventType = String(event?.event_type || "");
  const shopId = Number(event?.shop_id || 0);
  const resourceUrl = String(event?.resource_url || "");
  if (!eventType || !shopId || !resourceUrl) {
    return NextResponse.json({ error: "Missing Etsy event fields." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: connection, error: connectionError } = await supabase
    .from("petit_sot_etsy_connections")
    .select("etsy_shop_id")
    .eq("id", 1)
    .maybeSingle();
  if (connectionError || !connection?.etsy_shop_id || Number(connection.etsy_shop_id) !== shopId) {
    return NextResponse.json({ error: "Unknown Etsy shop." }, { status: 403 });
  }

  const match = resourceUrl.match(/^https:\/\/(?:api|openapi)\.etsy\.com\/v3\/application\/shops\/(\d+)\/receipts\/(\d+)(?:\?.*)?$/);
  if (!match || Number(match[1]) !== shopId) {
    return NextResponse.json({ error: "Unexpected Etsy receipt URL." }, { status: 400 });
  }
  const receiptId = match[2];

  let recorded: Awaited<ReturnType<typeof recordMarketplaceEvent>>;
  try {
    recorded = await recordMarketplaceEvent({
      marketplace: "etsy",
      eventId,
      eventType,
      resourceId: receiptId,
      payload: { event_type: eventType, shop_id: shopId, receipt_id: receiptId },
    });
  } catch {
    return NextResponse.json({ error: "Could not record event." }, { status: 500 });
  }

  if (recorded.status === "processed" || recorded.status === "conflict") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await updateMarketplaceEvent("etsy", eventId, "processing");

    if (eventType === "order.paid") {
      const receiptResponse = await etsyServerRequest(
        "/application/shops/" + shopId + "/receipts/" + receiptId,
      );
      if (!receiptResponse.ok) {
        throw new Error("Could not fetch Etsy receipt (HTTP " + receiptResponse.status + ").");
      }
      const receipt: any = await receiptResponse.json();
      if (receipt?.is_paid === false) throw new Error("Etsy receipt is not marked paid.");

      const transactions = Array.isArray(receipt?.transactions) ? receipt.transactions : [];
      for (const transaction of transactions) {
        const listingId = Number(transaction?.listing_id || 0);
        if (!listingId) continue;
        const artwork = await getArtworkForEtsyListing(listingId);
        if (artwork) await markArtworkSold(artwork, "etsy", receiptId);
      }
    }

    await updateMarketplaceEvent("etsy", eventId, "processed");
    return NextResponse.json({ received: true });
  } catch (error: any) {
    const message = String(error?.message || "Etsy order event processing failed.");
    await updateMarketplaceEvent("etsy", eventId, "error", message).catch(() => {});
    return NextResponse.json({ error: message.slice(0, 200) }, { status: 500 });
  }
}

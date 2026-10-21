import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";
import { NextResponse } from "next/server";
import { getEbayApplicationToken, getEbayUserAccessToken } from "../../../../lib/ebay";
import {
  getArtworkForEbayOrder,
  markArtworkSold,
  recordMarketplaceEvent,
  updateMarketplaceEvent,
} from "../../../../lib/marketplace-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINT = "https://www.petitsot.com/api/ebay/notifications";
const publicKeyCache = new Map<string, { key: string; expiresAt: number }>();

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

async function getEbayPublicKey(keyId: string) {
  const cached = publicKeyCache.get(keyId);
  if (cached && cached.expiresAt > Date.now()) return cached.key;
  const token = await getEbayApplicationToken();
  const response = await fetch(
    "https://api.ebay.com/commerce/notification/v1/public_key/" + encodeURIComponent(keyId),
    { headers: { Authorization: "Bearer " + token, Accept: "application/json" }, cache: "no-store" },
  );
  if (!response.ok) throw new Error("Could not retrieve eBay notification public key (HTTP " + response.status + ").");
  const payload: any = await response.json();
  if (typeof payload?.key !== "string" || !payload.key.includes("BEGIN PUBLIC KEY")) {
    throw new Error("eBay notification public key response was invalid.");
  }
  publicKeyCache.set(keyId, { key: payload.key, expiresAt: Date.now() + 60 * 60 * 1000 });
  return payload.key;
}

async function verifyEbayNotification(payload: any, signatureHeader: string | null) {
  if (!signatureHeader) return false;
  let header: any;
  try {
    header = JSON.parse(Buffer.from(signatureHeader, "base64").toString("utf8"));
  } catch {
    return false;
  }
  const keyId = String(header?.kid || "");
  const signature = String(header?.signature || "");
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(keyId) || !signature) return false;
  const pem = await getEbayPublicKey(keyId);
  try {
    return verifySignature(
      "sha1",
      Buffer.from(JSON.stringify(payload), "utf8"),
      createPublicKey(pem),
      Buffer.from(signature, "base64"),
    );
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const challenge = new URL(request.url).searchParams.get("challenge_code");
  const verificationToken = process.env.EBAY_NOTIFICATION_VERIFICATION_TOKEN?.trim();
  if (!challenge || !verificationToken) {
    return json({ error: "Missing challenge code or eBay verification configuration." }, 400);
  }
  const challengeResponse = createHash("sha256")
    .update(challenge + verificationToken + ENDPOINT, "utf8")
    .digest("hex");
  return json({ challengeResponse });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON notification." }, 400);
  }

  try {
    const valid = await verifyEbayNotification(payload, request.headers.get("x-ebay-signature"));
    if (!valid) return json({ error: "Invalid eBay notification signature." }, 412);

    const topic = String(payload?.metadata?.topic || "");
    const notificationId = String(payload?.notification?.notificationId || "");
    if (!topic || !notificationId) return json({ error: "Notification metadata is incomplete." }, 400);

    const recorded = await recordMarketplaceEvent({
      marketplace: "ebay",
      eventId: notificationId,
      eventType: topic,
      resourceId: String(payload?.notification?.data?.orderId || payload?.notification?.data?.order?.orderId || ""),
      payload: { topic, notificationId },
    });
    if (recorded.status === "processed" || recorded.status === "conflict") {
      return new NextResponse(null, { status: 204 });
    }

    await updateMarketplaceEvent("ebay", notificationId, "processing");

    if (topic === "ORDER_CONFIRMATION") {
      const orderId = String(payload?.notification?.data?.order?.orderId || "");
      if (!orderId) throw new Error("eBay order notification did not include an order ID.");

      const accessToken = await getEbayUserAccessToken();
      const orderResponse = await fetch(
        "https://api.ebay.com/sell/fulfillment/v1/order/" + encodeURIComponent(orderId),
        { headers: { Authorization: "Bearer " + accessToken, Accept: "application/json" }, cache: "no-store" },
      );
      const order: any = await orderResponse.json().catch(() => ({}));
      if (!orderResponse.ok) throw new Error("Could not fetch eBay order (HTTP " + orderResponse.status + ").");
      if (String(order?.orderPaymentStatus || "").toUpperCase() !== "PAID") {
        throw new Error("eBay order is not confirmed as paid yet.");
      }

      const lineItems = Array.isArray(order?.orderLineItems) ? order.orderLineItems : [];
      for (const lineItem of lineItems) {
        const listingId = String(lineItem?.legacyItemId || lineItem?.listingId || "");
        const sku = lineItem?.sku ? String(lineItem.sku) : null;
        if (!listingId && !sku) continue;
        const artwork = await getArtworkForEbayOrder(listingId, sku);
        if (artwork) await markArtworkSold(artwork, "ebay", orderId);
      }
    }

    await updateMarketplaceEvent("ebay", notificationId, "processed");
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    const message = String(error?.message || "eBay notification processing failed.");
    const id = String(payload?.notification?.notificationId || "");
    if (id) await updateMarketplaceEvent("ebay", id, "error", message).catch(() => {});
    return json({ error: message.slice(0, 200) }, 503);
  }
}

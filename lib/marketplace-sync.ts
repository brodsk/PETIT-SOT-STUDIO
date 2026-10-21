import "server-only";
import { createAdminClient } from "./supabase/admin";
import { getEbayUserAccessToken } from "./ebay";

const ETSY_API = "https://openapi.etsy.com/v3";
const ETSY_TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";

type ArtworkSyncRow = {
  id: string;
  status: string;
  etsy_listing_id: number | null;
  etsy_state: string | null;
  ebay_offer_id: string | null;
  ebay_listing_id: string | null;
  ebay_sku: string | null;
  sold_platform: string | null;
};

function etsyHeaders(accessToken: string) {
  const key = process.env.ETSY_API_KEYSTRING?.trim();
  const secret = process.env.ETSY_SHARED_SECRET?.trim();
  if (!key || !secret) throw new Error("Etsy API credentials are not configured.");
  return {
    "x-api-key": key + ":" + secret,
    Authorization: "Bearer " + accessToken,
    Accept: "application/json",
  };
}

export async function etsyServerRequest(path: string, init: RequestInit = {}) {
  const supabase = createAdminClient();
  const { data: connection, error } = await supabase
    .from("petit_sot_etsy_connections")
    .select("id,etsy_user_id,etsy_shop_id,access_token,refresh_token,expires_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error("Could not read Etsy connection.");
  if (!connection?.access_token || !connection?.refresh_token || !connection?.etsy_shop_id) {
    throw new Error("Etsy is not connected.");
  }

  let accessToken = String(connection.access_token);
  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  if (!expiresAt || expiresAt - Date.now() < 120_000) {
    const key = process.env.ETSY_API_KEYSTRING?.trim();
    if (!key) throw new Error("Etsy API credentials are not configured.");
    const refreshed = await fetch(ETSY_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: key,
        refresh_token: String(connection.refresh_token),
      }),
      cache: "no-store",
    });
    const data: any = await refreshed.json().catch(() => ({}));
    if (!refreshed.ok || !data.access_token) {
      throw new Error("Etsy token refresh failed (HTTP " + refreshed.status + ").");
    }
    accessToken = String(data.access_token);
    const update = await supabase.from("petit_sot_etsy_connections").update({
      access_token: accessToken,
      refresh_token: data.refresh_token || connection.refresh_token,
      expires_at: new Date(Date.now() + Number(data.expires_in || 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (update.error) throw new Error("Could not save refreshed Etsy token.");
  }

  const headers = new Headers(init.headers);
  const baseHeaders = etsyHeaders(accessToken);
  headers.set("x-api-key", baseHeaders["x-api-key"]);
  headers.set("Authorization", baseHeaders.Authorization);
  headers.set("Accept", baseHeaders.Accept);
  if (!headers.has("content-type") && init.body && !(init.body instanceof FormData)) {
    headers.set("content-type", "application/x-www-form-urlencoded");
  }
  const response = await fetch(ETSY_API + path, {
    ...init,
    headers,
    cache: "no-store",
  });
  return response;
}

export async function deactivateEtsyListing(listingId: number) {
  const supabase = createAdminClient();
  const { data: connection, error } = await supabase
    .from("petit_sot_etsy_connections")
    .select("etsy_shop_id")
    .eq("id", 1)
    .maybeSingle();
  if (error || !connection?.etsy_shop_id) throw new Error("Etsy shop connection is unavailable.");

  const response = await etsyServerRequest(
    "/application/shops/" + connection.etsy_shop_id + "/listings/" + listingId,
    { method: "PUT", body: new URLSearchParams({ state: "inactive" }) },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error("Could not deactivate Etsy listing #" + listingId + " (HTTP " + response.status + ").");
  }
}

export async function withdrawEbayOffer(offerId: string) {
  const token = await getEbayUserAccessToken();
  const response = await fetch(
    "https://api.ebay.com/sell/inventory/v1/offer/" + encodeURIComponent(offerId) + "/withdraw",
    { method: "POST", headers: { Authorization: "Bearer " + token, Accept: "application/json" }, cache: "no-store" },
  );
  if (!response.ok && response.status !== 404 && response.status !== 409) {
    throw new Error("Could not withdraw eBay offer (HTTP " + response.status + ").");
  }
}

export async function getArtworkForEtsyListing(listingId: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("petit_sot_artworks")
    .select("id,status,etsy_listing_id,etsy_state,ebay_offer_id,ebay_listing_id,ebay_sku,sold_platform")
    .eq("etsy_listing_id", listingId)
    .maybeSingle();
  if (error) throw new Error("Could not find the artwork for this Etsy listing.");
  return data as ArtworkSyncRow | null;
}

export async function getArtworkForEbayOrder(listingId: string, sku?: string | null) {
  const supabase = createAdminClient();
  if (sku) {
    const bySku = await supabase
      .from("petit_sot_artworks")
      .select("id,status,etsy_listing_id,etsy_state,ebay_offer_id,ebay_listing_id,ebay_sku,sold_platform")
      .eq("ebay_sku", sku)
      .maybeSingle();
    if (bySku.error) throw new Error("Could not find the artwork for this eBay SKU.");
    if (bySku.data) return bySku.data as ArtworkSyncRow;
  }
  const byListing = await supabase
    .from("petit_sot_artworks")
    .select("id,status,etsy_listing_id,etsy_state,ebay_offer_id,ebay_listing_id,ebay_sku,sold_platform")
    .eq("ebay_listing_id", listingId)
    .maybeSingle();
  if (byListing.error) throw new Error("Could not find the artwork for this eBay listing.");
  return byListing.data as ArtworkSyncRow | null;
}

export async function markArtworkSold(
  artwork: ArtworkSyncRow,
  soldPlatform: "etsy" | "ebay",
  orderId: string,
) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Preserve the first platform recorded as the seller; later notifications still
  // close the counterpart listing, but never overwrite the original source.
  if (artwork.status !== "sold") {
    const { error } = await supabase.from("petit_sot_artworks").update({
      status: "sold",
      sold_platform: soldPlatform,
      sold_order_id: orderId.slice(0, 200),
      sold_at: now,
      updated_at: now,
    }).eq("id", artwork.id).neq("status", "sold");
    if (error) throw new Error("Could not mark the artwork as sold.");
  }

  if (soldPlatform === "etsy" && artwork.ebay_offer_id) {
    await withdrawEbayOffer(artwork.ebay_offer_id);
    await supabase.from("petit_sot_artworks").update({
      ebay_state: "withdrawn",
      ebay_error: null,
      ebay_synced_at: now,
    }).eq("id", artwork.id);
  }

  if (soldPlatform === "ebay" && artwork.etsy_listing_id) {
    await deactivateEtsyListing(Number(artwork.etsy_listing_id));
    await supabase.from("petit_sot_artworks").update({
      etsy_state: "inactive",
      etsy_error: null,
      etsy_synced_at: now,
    }).eq("id", artwork.id);
  }
}

export async function recordMarketplaceEvent(input: {
  marketplace: "etsy" | "ebay";
  eventId: string;
  eventType: string;
  resourceId?: string | null;
  payload: unknown;
}) {
  const supabase = createAdminClient();
  const insert = await supabase.from("petit_sot_marketplace_events").upsert({
    marketplace: input.marketplace,
    event_id: input.eventId,
    event_type: input.eventType,
    resource_id: input.resourceId || null,
    payload: input.payload as any,
    status: "received",
    error: null,
  }, { onConflict: "marketplace,event_id", ignoreDuplicates: true });
  if (insert.error) throw new Error("Could not record marketplace event.");

  const { data, error } = await supabase
    .from("petit_sot_marketplace_events")
    .select("status")
    .eq("marketplace", input.marketplace)
    .eq("event_id", input.eventId)
    .maybeSingle();
  if (error || !data) throw new Error("Could not read marketplace event state.");
  return { supabase, status: String(data.status) };
}

export async function updateMarketplaceEvent(
  marketplace: "etsy" | "ebay",
  eventId: string,
  status: "processing" | "processed" | "error" | "conflict",
  errorMessage?: string | null,
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("petit_sot_marketplace_events").update({
    status,
    error: errorMessage ? errorMessage.slice(0, 1000) : null,
    processed_at: status === "processed" || status === "conflict" ? new Date().toISOString() : null,
  }).eq("marketplace", marketplace).eq("event_id", eventId);
  if (error) throw new Error("Could not update marketplace event state.");
}

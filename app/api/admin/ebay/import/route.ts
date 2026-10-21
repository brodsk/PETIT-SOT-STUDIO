import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { getEbayUserAccessToken } from "../../../../../lib/ebay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = "https://api.ebay.com/sell/inventory/v1";

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function ebayRequest(path: string, token: string, method: string, body?: unknown) {
  const response = await fetch(API + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function POST(request: Request) {
  const { supabase } = await requireAdmin();
  const input = await request.json().catch(() => ({}));
  const artworkId = String(input?.artworkId || "");
  if (!artworkId) return error("Не указана картина.");

  const marketplaceId = process.env.EBAY_MARKETPLACE_ID?.trim();
  const currency = (process.env.EBAY_CURRENCY || "").trim().toUpperCase();
  const locationKey = process.env.EBAY_MERCHANT_LOCATION_KEY?.trim();
  const fulfillmentPolicyId = process.env.EBAY_FULFILLMENT_POLICY_ID?.trim();
  const paymentPolicyId = process.env.EBAY_PAYMENT_POLICY_ID?.trim();
  const returnPolicyId = process.env.EBAY_RETURN_POLICY_ID?.trim();
  const categoryId = process.env.EBAY_CATEGORY_ID?.trim();
  const rateText = process.env.EBAY_EUR_TO_LISTING_CURRENCY_RATE?.trim();
  const missing = [
    ["EBAY_MARKETPLACE_ID", marketplaceId],
    ["EBAY_CURRENCY", currency],
    ["EBAY_MERCHANT_LOCATION_KEY", locationKey],
    ["EBAY_FULFILLMENT_POLICY_ID", fulfillmentPolicyId],
    ["EBAY_PAYMENT_POLICY_ID", paymentPolicyId],
    ["EBAY_RETURN_POLICY_ID", returnPolicyId],
    ["EBAY_CATEGORY_ID", categoryId],
  ].filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) return error("Сначала настройте параметры eBay в Vercel: " + missing.join(", ") + ".", 409);
  if (!["EBAY_US", "EBAY_DE"].includes(marketplaceId!)) {
    return error("Пока поддерживаются маркетплейсы EBAY_US и EBAY_DE.");
  }
  if (!["USD", "EUR"].includes(currency)) return error("Валюта eBay должна быть USD или EUR.");
  const rate = currency === "EUR" ? 1 : Number(rateText);
  if (!Number.isFinite(rate) || rate <= 0) {
    return error("Для цены в USD задайте EBAY_EUR_TO_LISTING_CURRENCY_RATE в Vercel.");
  }

  const { data: artwork, error: artworkError } = await supabase
    .from("petit_sot_artworks")
    .select("id,slug,title,title_en,year,medium,width_cm,height_cm,depth_cm,description,description_en,price_eur,status,image_path,etsy_listing_id,etsy_state,ebay_sku,ebay_offer_id,ebay_listing_id")
    .eq("id", artworkId)
    .single();
  if (artworkError || !artwork) return error("Картина не найдена.", 404);
  if (artwork.status !== "available") return error("Публиковать можно только картины со статусом available.");
  if (artwork.ebay_listing_id) return error("У этой картины уже есть eBay listing #" + artwork.ebay_listing_id + ".");

  const imagePaths: string[] = [];
  if (artwork.image_path) imagePaths.push(String(artwork.image_path));
  const { data: gallery, error: galleryError } = await supabase
    .from("petit_sot_artwork_images")
    .select("image_path,sort_order")
    .eq("artwork_id", artwork.id)
    .order("sort_order", { ascending: true });
  if (galleryError) return error("Не удалось прочитать фотографии картины.", 500);
  for (const image of gallery || []) {
    if (image.image_path && !imagePaths.includes(image.image_path)) imagePaths.push(image.image_path);
  }
  const imageUrls = imagePaths.map(path => supabase.storage.from("petit-sot-artworks").getPublicUrl(path).data.publicUrl).filter(Boolean);
  if (!imageUrls.length) return error("У картины нет публичной фотографии.");

  const slug = String(artwork.slug || artwork.id).toUpperCase().replace(/[^A-Z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 43);
  const sku = String(artwork.ebay_sku || ("PS-" + slug)).slice(0, 50);
  const title = String(artwork.title_en || artwork.title || "Original painting").replace(/\s+/g, " ").slice(0, 80);
  const description = [
    artwork.description_en || artwork.description || "",
    artwork.medium ? "Medium: " + artwork.medium : "",
    artwork.year ? "Year: " + artwork.year : "",
    artwork.width_cm && artwork.height_cm
      ? "Dimensions: " + artwork.width_cm + " × " + artwork.height_cm + (artwork.depth_cm ? " × " + artwork.depth_cm : "") + " cm"
      : "",
    "Original artwork by Olga Trikhleb. One-of-a-kind original painting.",
  ].filter(Boolean).join("\n\n");
  const price = Math.round(Number(artwork.price_eur) * rate * 100) / 100;
  if (!Number.isFinite(price) || price <= 0) return error("У картины указана некорректная цена.");

  try {
    const token = await getEbayUserAccessToken();
    const saveSku = await supabase.from("petit_sot_artworks").update({
      ebay_sku: sku,
      ebay_state: "draft",
      ebay_error: null,
      ebay_synced_at: new Date().toISOString(),
    }).eq("id", artwork.id);
    if (saveSku.error) throw new Error("Не удалось сохранить SKU картины.");

    const inventoryItem = {
      availability: { shipToLocationAvailability: { quantity: 1 } },
      condition: "NEW",
      product: {
        title,
        description,
        imageUrls,
        aspects: {
          Artist: ["Olga Trikhleb"],
          Type: ["Painting"],
          Format: ["Original"],
          Medium: [String(artwork.medium || "Oil on canvas").slice(0, 65)],
        },
      },
    };
    const itemResult = await ebayRequest("/inventory_item/" + encodeURIComponent(sku), token, "PUT", inventoryItem);
    if (!itemResult.response.ok) {
      const detail = String(itemResult.data?.errors?.[0]?.message || itemResult.data?.message || "eBay rejected the inventory item.");
      throw new Error("Inventory item: " + detail.slice(0, 180));
    }

    let offerId = String(artwork.ebay_offer_id || "");
    if (!offerId) {
      const offerResult = await ebayRequest("/offer", token, "POST", {
        sku,
        marketplaceId,
        format: "FIXED_PRICE",
        availableQuantity: 1,
        categoryId,
        listingDescription: description,
        listingDuration: "GTC",
        merchantLocationKey: locationKey,
        pricingSummary: { price: { value: price.toFixed(2), currency } },
        listingPolicies: {
          fulfillmentPolicyId,
          paymentPolicyId,
          returnPolicyId,
        },
      });
      if (!offerResult.response.ok || !offerResult.data?.offerId) {
        const detail = String(offerResult.data?.errors?.[0]?.message || offerResult.data?.message || "eBay rejected the offer.");
        throw new Error("Offer: " + detail.slice(0, 180));
      }
      offerId = String(offerResult.data.offerId);
      const saveOffer = await supabase.from("petit_sot_artworks").update({ ebay_offer_id: offerId }).eq("id", artwork.id);
      if (saveOffer.error) throw new Error("Offer created but its ID could not be saved.");
    }

    const publishResult = await ebayRequest("/offer/" + encodeURIComponent(offerId) + "/publish", token, "POST");
    if (!publishResult.response.ok || !publishResult.data?.listingId) {
      const detail = String(publishResult.data?.errors?.[0]?.message || publishResult.data?.message || "eBay could not publish the offer.");
      throw new Error("Publish: " + detail.slice(0, 180));
    }

    const listingId = String(publishResult.data.listingId);
    const domain = marketplaceId === "EBAY_US" ? "www.ebay.com" : "www.ebay.de";
    const listingUrl = "https://" + domain + "/itm/" + listingId;
    const { error: saveError } = await supabase.from("petit_sot_artworks").update({
      ebay_sku: sku,
      ebay_offer_id: offerId,
      ebay_listing_id: listingId,
      ebay_state: "active",
      ebay_error: null,
      ebay_listing_url: listingUrl,
      ebay_synced_at: new Date().toISOString(),
    }).eq("id", artwork.id);
    if (saveError) throw new Error("eBay listing is live, but the listing ID could not be saved in PETIT.SOT.");

    return NextResponse.json({ ok: true, sku, offerId, listingId, listingUrl, price, currency }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    const message = String(err?.message || "Не удалось опубликовать картину на eBay.").slice(0, 500);
    await supabase.from("petit_sot_artworks").update({
      ebay_error: message,
      ebay_state: "error",
      ebay_synced_at: new Date().toISOString(),
    }).eq("id", artwork.id);
    return error(message, 502);
  }
}

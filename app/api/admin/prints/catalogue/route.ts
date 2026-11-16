import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requirePrintAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: admin } = await supabase
    .from("petit_sot_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { supabase };
}

export async function GET(request: Request) {
  const auth = await requirePrintAdmin();
  if ("response" in auth) return auth.response;

  const sku = new URL(request.url).searchParams.get("sku")?.trim() || "";
  if (!sku || sku.length > 100 || !/^[A-Za-z0-9._-]+$/.test(sku)) {
    return NextResponse.json({ error: "Enter a valid Prodigi catalogue SKU." }, { status: 400 });
  }

  const apiKey = process.env.PRODIGI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Prodigi API is not configured on the server." }, { status: 503 });
  }

  try {
    const headers = { "X-API-Key": apiKey, Accept: "application/json" };
    const productResponse = await fetch(
      "https://api.prodigi.com/v4.0/products/" + encodeURIComponent(sku),
      { headers, cache: "no-store" },
    );
    const productBody = await productResponse.json().catch(() => ({}));
    if (!productResponse.ok) {
      return NextResponse.json({
        error: productBody?.errors?.[0]?.message || productBody?.message || "Prodigi did not recognise this SKU.",
        upstreamStatus: productResponse.status,
      }, { status: productResponse.status === 404 ? 404 : 502 });
    }

    const product = productBody?.product || productBody;
    const quoteResponse = await fetch("https://api.prodigi.com/v4.0/quotes", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingMethod: "Standard",
        destinationCountryCode: "SK",
        currencyCode: "EUR",
        items: [{ sku, copies: 1, assets: [{ printArea: "default" }] }],
      }),
      cache: "no-store",
    });
    const quoteBody = await quoteResponse.json().catch(() => ({}));
    if (!quoteResponse.ok) {
      return NextResponse.json({
        error: quoteBody?.errors?.[0]?.message || quoteBody?.message || "Prodigi could not calculate a quote for this SKU.",
        product,
        quoteErrorStatus: quoteResponse.status,
      }, { status: 502 });
    }

    return NextResponse.json({
      product: {
        sku: product.sku || sku,
        description: product.description || product.name || sku,
        productDimensions: product.productDimensions || null,
        attributes: product.attributes || {},
        printAreas: product.printAreas || product.assets || null,
      },
      quote: quoteBody,
      quoteDestination: "SK",
      quoteShippingMethod: "Standard",
    });
  } catch (error) {
    console.error("Prodigi catalogue lookup failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not reach Prodigi. Please try again." }, { status: 502 });
  }
}


export async function POST(request: Request) {
  const auth = await requirePrintAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const artworkId = typeof body?.artworkId === "string" ? body.artworkId : "";
  const sku = typeof body?.sku === "string" ? body.sku.trim() : "";
  const retailPrice = Number(body?.retailPrice);
  if (!/^[0-9a-f-]{36}$/i.test(artworkId) || !sku || sku.length > 100 ||
      !/^[A-Za-z0-9._-]+$/.test(sku) || !Number.isFinite(retailPrice) || retailPrice <= 0 || retailPrice > 10000) {
    return NextResponse.json({ error: "Check the artwork, SKU and retail price." }, { status: 400 });
  }

  const apiKey = process.env.PRODIGI_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "Prodigi API is not configured on the server." }, { status: 503 });

  try {
    const { data: artwork, error: artworkError } = await auth.supabase
      .from("petit_sot_artworks")
      .select("id,slug,title,width_cm,height_cm,status")
      .eq("id", artworkId)
      .maybeSingle();
    if (artworkError || !artwork) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
    if (!artwork.width_cm || !artwork.height_cm) {
      return NextResponse.json({ error: "Artwork dimensions must be set before adding print sizes." }, { status: 409 });
    }

    const productResponse = await fetch("https://api.prodigi.com/v4.0/products/" + encodeURIComponent(sku), {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      cache: "no-store",
    });
    const productBody = await productResponse.json().catch(() => ({}));
    if (!productResponse.ok) {
      return NextResponse.json({ error: productBody?.message || "Prodigi did not recognise this SKU." }, { status: 422 });
    }
    const product = productBody?.product || productBody;
    const dimensions = product.productDimensions || {};
    const productWidth = Number(dimensions.width);
    const productHeight = Number(dimensions.height);
    if (!Number.isFinite(productWidth) || !Number.isFinite(productHeight) || productWidth <= 0 || productHeight <= 0) {
      return NextResponse.json({ error: "Prodigi did not return usable product dimensions for this SKU." }, { status: 422 });
    }
    const artworkRatio = Number(artwork.width_cm) / Number(artwork.height_cm);
    const productRatio = productWidth / productHeight;
    const directDifference = Math.abs(artworkRatio - productRatio) / artworkRatio;
    if (directDifference > 0.01) {
      return NextResponse.json({
        error: "This print size has a different aspect ratio from the original artwork. It is blocked to prevent cropping or stretching.",
        artworkRatio,
        productRatio,
      }, { status: 409 });
    }

    const unit = String(dimensions.units || "").toLowerCase();
    const toMm = unit === "mm" ? 1 : unit === "cm" ? 10 : unit === "in" ? 25.4 : 0;
    if (!toMm) return NextResponse.json({ error: "Unsupported Prodigi dimension unit." }, { status: 422 });
    const widthMm = Math.round(productWidth * toMm);
    const heightMm = Math.round(productHeight * toMm);

    const quoteResponse = await fetch("https://api.prodigi.com/v4.0/quotes", {
      method: "POST",
      headers: { "X-API-Key": apiKey, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingMethod: "Standard",
        destinationCountryCode: "SK",
        currencyCode: "EUR",
        items: [{ sku, copies: 1, assets: [{ printArea: "default" }] }],
      }),
      cache: "no-store",
    });
    const quote = await quoteResponse.json().catch(() => ({}));
    if (!quoteResponse.ok) return NextResponse.json({ error: quote?.message || "Prodigi quote failed." }, { status: 502 });

    const { data: saved, error: saveError } = await auth.supabase
      .from("petit_sot_print_variants")
      .insert({
        artwork_id: artworkId,
        prodigi_sku: sku,
        size_label: product.description || (widthMm + " × " + heightMm + " mm"),
        width_mm: widthMm,
        height_mm: heightMm,
        paper_type: "fine_art",
        retail_price_eur: retailPrice,
        active: false,
      })
      .select("*")
      .single();
    if (saveError) {
      if (saveError.code === "23505") return NextResponse.json({ error: "This SKU is already added to this artwork." }, { status: 409 });
      console.error("Could not save Prodigi print variant", saveError.code);
      return NextResponse.json({ error: "Could not save print variant." }, { status: 500 });
    }

    return NextResponse.json({ variant: saved, product: { sku, description: product.description || sku, productDimensions: dimensions }, quote });
  } catch (error) {
    console.error("Prodigi print variant setup failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not validate or save this Prodigi SKU." }, { status: 502 });
  }
}

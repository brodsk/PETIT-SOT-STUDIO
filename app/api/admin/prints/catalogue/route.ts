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

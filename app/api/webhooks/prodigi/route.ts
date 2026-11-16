import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrderId(payload: any): string {
  const candidates = [
    payload?.order?.id,
    payload?.orderId,
    payload?.order_id,
    payload?.subject,
    payload?.data?.order?.id,
    payload?.id,
  ];
  return candidates.find((value) =>
    typeof value === "string" && /^[A-Za-z0-9_-]{4,100}$/.test(value)
  ) || "";
}

export async function GET() {
  return NextResponse.json({ service: "PETIT.SOT Prodigi callback", status: "ready" });
}

export async function POST(request: Request) {
  const apiKey = process.env.PRODIGI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Prodigi integration is not configured." }, { status: 503 });
  }

  let payload: any;
  try {
    const raw = await request.text();
    if (raw.length > 1024 * 1024) {
      return NextResponse.json({ error: "Payload too large." }, { status: 413 });
    }
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const orderId = getOrderId(payload);
  if (!orderId) {
    return NextResponse.json({ error: "Prodigi order ID is missing." }, { status: 400 });
  }

  // Treat callbacks as untrusted input. Verify the order against Prodigi before
  // writing anything to our database.
  const upstream = await fetch(
    "https://api.prodigi.com/v4.0/Orders/" + encodeURIComponent(orderId),
    {
      method: "GET",
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    console.error("Prodigi callback verification failed", upstream.status);
    return NextResponse.json({ error: "Could not verify Prodigi order." }, { status: 502 });
  }

  const response = await upstream.json();
  const order = response?.order;
  if (!order || String(order.id) !== orderId) {
    return NextResponse.json({ error: "Prodigi order verification mismatch." }, { status: 400 });
  }

  const stage = String(order.status?.stage || "unknown").slice(0, 80);
  const safePayload = {
    callbackType: typeof payload?.type === "string" ? payload.type.slice(0, 160) : null,
    callbackId: typeof payload?.id === "string" ? payload.id.slice(0, 120) : null,
    callbackStatus: typeof payload?.status === "string" ? payload.status.slice(0, 80) : null,
    verifiedAt: new Date().toISOString(),
  };

  try {
    const db = createAdminClient();
    const { error } = await db.from("petit_sot_print_orders").upsert({
      prodigi_order_id: orderId,
      merchant_reference: typeof order.merchantReference === "string"
        ? order.merchantReference.slice(0, 160)
        : null,
      status_stage: stage,
      prodigi_created_at: order.created || null,
      prodigi_updated_at: order.lastUpdated || null,
      callback_payload: safePayload,
      last_callback_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "prodigi_order_id" });

    if (error) {
      console.error("Prodigi callback database write failed", error.code);
      return NextResponse.json({ error: "Could not record Prodigi update." }, { status: 500 });
    }
  } catch (error) {
    console.error("Prodigi callback processing failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not process Prodigi update." }, { status: 500 });
  }

  return NextResponse.json({ received: true, orderId, status: stage });
}

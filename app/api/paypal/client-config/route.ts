import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const environment = process.env.PAYPAL_ENVIRONMENT;

  if (!clientId || environment !== "live") {
    return NextResponse.json(
      { error: "PayPal Live is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { clientId },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTHORIZE_URL = "https://auth.ebay.com/oauth2/authorize";
const SCOPES = [
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
  "https://api.ebay.com/oauth/api_scope/offline_access",
];

export async function GET(request: NextRequest) {
  const clientId = process.env.EBAY_CLIENT_ID;
  const ruName = process.env.EBAY_RUNAME;

  if (!clientId || !ruName) {
    return NextResponse.json(
      { error: "eBay OAuth is not fully configured. Set EBAY_RUNAME in Vercel." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const state = randomBytes(32).toString("hex");
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", ruName);
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", state);

  const response = NextResponse.redirect(url);
  response.cookies.set("ebay_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/ebay/oauth/callback",
    maxAge: 10 * 60,
  });
  return response;
}

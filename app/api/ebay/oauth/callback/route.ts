import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";

function htmlPage(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>${title}</title></head><body style="font:16px system-ui;max-width:760px;margin:40px auto;padding:0 18px;line-height:1.5"><h1>${title}</h1>${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, max-age=0", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow, noarchive" } },
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const returnedState = params.get("state");
  const cookieState = request.cookies.get("ebay_oauth_state")?.value;
  const error = params.get("error");

  if (error) {
    const safeError = error.replace(/[<>]/g, "").slice(0, 160);
    const response = htmlPage("eBay authorization was not completed", `<p>eBay returned an authorization error: <code>${safeError}</code>. You can close this page and try again.</p>`, 400);
    response.cookies.delete("ebay_oauth_state");
    return response;
  }

  if (!code || !returnedState || !cookieState) {
    return htmlPage("Missing authorization details", "<p>The callback did not include the required authorization details. Start again from the PETIT.SOT eBay connection page.</p>", 400);
  }

  const left = Buffer.from(returnedState);
  const right = Buffer.from(cookieState);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    const response = htmlPage("Authorization state check failed", "<p>For safety, this callback was rejected. Start the connection again from the same browser.</p>", 400);
    response.cookies.delete("ebay_oauth_state");
    return response;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const ruName = process.env.EBAY_RUNAME;

  if (!clientId || !clientSecret || !ruName) {
    return htmlPage("eBay OAuth is not configured", "<p>The server is missing required eBay configuration. No token was stored. Please configure the production RuName in Vercel.</p>", 503);
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: ruName,
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    return htmlPage("Could not exchange eBay authorization code", `<p>eBay token exchange failed with HTTP ${tokenResponse.status}. No token was displayed. Check the Production RuName and OAuth settings, then try again.</p>`, 502);
  }

  const payload = (await tokenResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    expires_in?: number;
  };

  if (!payload.refresh_token) {
    return htmlPage("eBay did not return a refresh token", "<p>The authorization succeeded but eBay did not return a refresh token. Check that the offline_access scope was granted, then authorize again.</p>", 502);
  }

  const token = payload.refresh_token.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const expiry = payload.refresh_token_expires_in ? Math.floor(payload.refresh_token_expires_in / 86400) : null;
  const response = htmlPage(
    "eBay connected — save the refresh token",
    `<p>Authorization code was exchanged successfully. The refresh token is shown once in this private response; it has <strong>not</strong> been saved permanently by the server yet.</p><p><strong>Copy the token below into Vercel Production environment variable <code>EBAY_REFRESH_TOKEN</code>.</strong> Do not send it in chat or add it to GitHub.</p><textarea readonly style="width:100%;min-height:150px;box-sizing:border-box;font:13px monospace" onclick="this.select()">${token}</textarea><p><button onclick="const t=document.querySelector('textarea');t.select();navigator.clipboard.writeText(t.value).then(()=>this.textContent='Copied')">Copy refresh token</button></p>${expiry ? `<p>Approximate token lifetime: ${expiry} days. The server will use it to request short-lived access tokens.</p>` : ""}<p>After saving it in Vercel, redeploy the production site. Then close this page.</p>`,
  );
  response.cookies.delete("ebay_oauth_state");
  return response;
}

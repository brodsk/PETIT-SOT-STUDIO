import "server-only";

const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_APP_SCOPE = "https://api.ebay.com/oauth/api_scope";

export async function getEbayApplicationToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("eBay production credentials are not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: EBAY_APP_SCOPE,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    // Do not include eBay's raw response or credentials in logs/API responses.
    throw new Error(`eBay OAuth application-token request failed (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("eBay OAuth response did not contain an access token");
  }

  return payload.access_token;
}

/**
 * Exchange the stored seller refresh token for a short-lived user access token.
 * Keep EBAY_REFRESH_TOKEN in Vercel's encrypted Production environment only.
 */
export async function getEbayUserAccessToken(): Promise<string> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const refreshToken = process.env.EBAY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("eBay seller OAuth credentials are not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`eBay OAuth user-token refresh failed (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("eBay OAuth refresh response did not contain an access token");
  }

  return payload.access_token;
}

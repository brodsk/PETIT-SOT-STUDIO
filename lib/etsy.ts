import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createClient } from "./supabase/server";

const ETSY_API = "https://api.etsy.com/v3";
const ETSY_OAUTH = "https://www.etsy.com/oauth/connect";
const ETSY_TOKEN = "https://api.etsy.com/v3/public/oauth/token";
const CONNECTION_ID = 1;

function config() {
  const key = process.env.ETSY_API_KEYSTRING?.trim();
  const secret = process.env.ETSY_SHARED_SECRET?.trim();
  if (!key || !secret) throw new Error("Etsy API credentials are not configured.");
  return { key, secret };
}

export function etsyRedirectUri() {
  return process.env.ETSY_REDIRECT_URI?.trim() ||
    "https://petit-sot-studio.vercel.app/api/admin/etsy/callback";
}

export function createPkce() {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export async function startEtsyOAuth() {
  const { key } = config();
  const state = randomBytes(32).toString("base64url");
  const { verifier, challenge } = createPkce();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: key,
    redirect_uri: etsyRedirectUri(),
    scope: "listings_r listings_w shops_r",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  const cookieStore = await cookies();
  cookieStore.set("etsy_oauth_state", state, { httpOnly:true, secure:true, sameSite:"lax", maxAge:600, path:"/" });
  cookieStore.set("etsy_oauth_verifier", verifier, { httpOnly:true, secure:true, sameSite:"lax", maxAge:600, path:"/" });
  return ETSY_OAUTH + "?" + params.toString();
}

export async function exchangeEtsyCode(code:string, verifier:string) {
  const { key } = config();
  const body = new URLSearchParams({
    grant_type:"authorization_code",
    client_id:key,
    redirect_uri:etsyRedirectUri(),
    code,
    code_verifier:verifier,
  });
  const response = await fetch(ETSY_TOKEN, {
    method:"POST",
    headers:{"content-type":"application/x-www-form-urlencoded"},
    body,
    cache:"no-store",
  });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error_description || data.error || "Etsy OAuth token exchange failed.");
  return data as {access_token:string;refresh_token:string;expires_in:number;scope:string;token_type:string};
}

export async function etsyRequest(path:string, init:RequestInit={}) {
  const { key, secret } = config();
  const supabase = await createClient();
  const { data: connection, error } = await supabase
    .from("petit_sot_etsy_connections")
    .select("*")
    .eq("id", CONNECTION_ID)
    .maybeSingle();
  if (error) throw error;
  if (!connection?.access_token || !connection?.refresh_token) throw new Error("Etsy is not connected.");

  let accessToken = connection.access_token;
  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  if (!expiresAt || expiresAt - Date.now() < 120000) {
    const body = new URLSearchParams({
      grant_type:"refresh_token",
      client_id:key,
      refresh_token:connection.refresh_token,
    });
    const refreshed = await fetch(ETSY_TOKEN, {
      method:"POST",
      headers:{"content-type":"application/x-www-form-urlencoded"},
      body,
      cache:"no-store",
    });
    const data = await refreshed.json().catch(()=>({}));
    if (!refreshed.ok) throw new Error(data.error_description || data.error || "Etsy token refresh failed.");
    accessToken = data.access_token;
    const refreshToken = data.refresh_token || connection.refresh_token;
    const expiresIn = Number(data.expires_in || 3600);
    const { error:updateError } = await supabase.from("petit_sot_etsy_connections").update({
      access_token:accessToken,
      refresh_token:refreshToken,
      expires_at:new Date(Date.now()+expiresIn*1000).toISOString(),
      updated_at:new Date().toISOString(),
    }).eq("id",CONNECTION_ID);
    if (updateError) throw updateError;
  }

  const headers = new Headers(init.headers);
  headers.set("x-api-key", key + ":" + secret);
  headers.set("Authorization", "Bearer " + accessToken);
  if (!headers.has("content-type") && init.body) headers.set("content-type","application/x-www-form-urlencoded");

  return fetch(ETSY_API + path, {...init, headers, cache:"no-store"});
}

export async function getEtsyConnection() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("petit_sot_etsy_connections").select("etsy_user_id,etsy_shop_id,shop_name,expires_at,scope,updated_at").eq("id",CONNECTION_ID).maybeSingle();
  if (error) throw error;
  return data;
}

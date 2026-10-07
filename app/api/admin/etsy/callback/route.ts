import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "../../../../../lib/admin";
import { exchangeEtsyCode, etsyRedirectUri } from "../../../../../lib/etsy";

export async function GET(request:Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) return NextResponse.redirect(new URL("/admin?etsy=error&reason="+encodeURIComponent(error), request.url));

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("etsy_oauth_state")?.value;
  const verifier = cookieStore.get("etsy_oauth_verifier")?.value;
  cookieStore.delete("etsy_oauth_state");
  cookieStore.delete("etsy_oauth_verifier");

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return NextResponse.redirect(new URL("/admin?etsy=error&reason=invalid_oauth_state", request.url));
  }

  try {
    const { supabase } = await requireAdmin();
    const token = await exchangeEtsyCode(code, verifier);
    const userId = Number(String(token.access_token).split(".")[0]);
    if (!Number.isFinite(userId) || userId <= 0) throw new Error("Etsy returned an invalid user id.");

    const apiKey = process.env.ETSY_API_KEYSTRING?.trim();
    const sharedSecret = process.env.ETSY_SHARED_SECRET?.trim();
    if (!apiKey || !sharedSecret) throw new Error("Etsy API credentials are not configured.");

    const headers = {
      "x-api-key": apiKey + ":" + sharedSecret,
      "Authorization": "Bearer " + token.access_token,
    };
    const shopsResponse = await fetch("https://api.etsy.com/v3/application/users/"+userId+"/shops", {headers, cache:"no-store"});
    const shops = await shopsResponse.json().catch(()=>({}));
    if (!shopsResponse.ok) throw new Error(shops.error || "Could not read Etsy shop.");

    const shop = shops.results?.[0];
    if (!shop?.shop_id) throw new Error("No Etsy shop was found for this account.");

    const { error:saveError } = await supabase.from("petit_sot_etsy_connections").upsert({
      id:1,
      etsy_user_id:userId,
      etsy_shop_id:Number(shop.shop_id),
      shop_name:shop.shop_name || null,
      access_token:token.access_token,
      refresh_token:token.refresh_token,
      expires_at:new Date(Date.now()+Number(token.expires_in||3600)*1000).toISOString(),
      scope:token.scope || null,
      updated_at:new Date().toISOString(),
    }, {onConflict:"id"});
    if (saveError) throw saveError;

    return NextResponse.redirect(new URL("/admin?etsy=connected", request.url));
  } catch (err:any) {
    return NextResponse.redirect(new URL("/admin?etsy=error&reason="+encodeURIComponent(err?.message||"connection_failed"), request.url));
  }
}

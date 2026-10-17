import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "../../../../../lib/admin";
import { exchangePinterestCode } from "../../../../../lib/pinterest";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return NextResponse.redirect(new URL("/admin/pinterest?error=" + encodeURIComponent(oauthError), request.url));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("pinterest_oauth_state")?.value;
  cookieStore.delete("pinterest_oauth_state");
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/admin/pinterest?error=invalid_oauth_state", request.url));
  }

  try {
    const { supabase } = await requireAdmin();
    const token = await exchangePinterestCode(code);
    const expiresIn = Number(token.expires_in || 2592000);
    const refreshExpiresIn = Number(token.refresh_token_expires_in || 0);
    const { error } = await supabase.from("petit_sot_pinterest_connections").upsert({
      id: 1,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      refresh_token_expires_at: refreshExpiresIn ? new Date(Date.now() + refreshExpiresIn * 1000).toISOString() : null,
      scope: token.scope || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (error) throw error;
    return NextResponse.redirect(new URL("/admin/pinterest?connected=1", request.url));
  } catch (error: any) {
    return NextResponse.redirect(new URL("/admin/pinterest?error=" + encodeURIComponent(error?.message || "pinterest_connection_failed"), request.url));
  }
}

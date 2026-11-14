import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { exchangeZohoCode, storeZohoConnection } from "../../../../../lib/zoho-mail";

export async function GET(request:Request) {
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  const state=url.searchParams.get("state");
  const oauthError=url.searchParams.get("error");
  const cookieStore=await cookies();
  const expected=cookieStore.get("zoho_oauth_state")?.value;
  cookieStore.delete("zoho_oauth_state");
  const redirect=(query:string)=>NextResponse.redirect(new URL("/admin/mail"+query,request.url));
  if(oauthError)return redirect("?error="+encodeURIComponent(oauthError));
  if(!code||!state||!expected||state!==expected)return redirect("?error=invalid_oauth_state");
  try {
    await requireAdmin();
    const token=await exchangeZohoCode(code);
    await storeZohoConnection(token);
    return redirect("?connected=1");
  } catch(error:any) {
    return redirect("?error="+encodeURIComponent(error?.message||"oauth_failed"));
  }
}

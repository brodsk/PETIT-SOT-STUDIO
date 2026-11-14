import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { startZohoOAuth } from "../../../../../lib/zoho-mail";

export async function GET() {
  await requireAdmin();
  try { return NextResponse.redirect(await startZohoOAuth()); }
  catch (error:any) { return NextResponse.redirect(new URL("/admin/mail?error="+encodeURIComponent(error?.message||"oauth_config"),"https://www.petitsot.com")); }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { startEtsyOAuth } from "../../../../../lib/etsy";

export async function GET() {
  await requireAdmin();
  return NextResponse.redirect(await startEtsyOAuth());
}

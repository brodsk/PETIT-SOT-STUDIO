import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { getEtsyConnection } from "../../../../../lib/etsy";

export async function GET() {
  await requireAdmin();
  try {
    const connection = await getEtsyConnection();
    return NextResponse.json({connected:Boolean(connection),connection});
  } catch (err:any) {
    return NextResponse.json({error:err?.message||"Failed to read Etsy status."},{status:500});
  }
}

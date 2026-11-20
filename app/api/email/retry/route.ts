import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { sendOrderEmails } from "../../../../lib/email/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.EMAIL_RETRY_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "Email retry is not configured" }, { status: 503 });
  const authorization = request.headers.get("authorization") || "";
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    const db = createAdminClient();
    let ids: string[] = [];

    if (orderId) {
      const { data, error } = await db.from("petit_sot_orders").select("id")
        .eq("id", orderId).eq("status", "paid").maybeSingle();
      if (error) throw error;
      if (data?.id) ids = [data.id];
    } else {
      const { data, error } = await db.from("petit_sot_orders").select("id")
        .eq("status", "paid")
        .or("buyer_email_sent_at.is.null,owner_email_sent_at.is.null")
        .order("created_at", { ascending: true })
        .limit(25);
      if (error) throw error;
      ids = (data || []).map((row: { id: string }) => row.id);
    }

    const results = [];
    for (const id of ids) {
      try {
        results.push({ orderId: id, ...(await sendOrderEmails(id)) });
      } catch (error) {
        console.error("PETIT.SOT email retry processing failed", {
          orderId: id,
          reason: error instanceof Error ? error.message.slice(0, 120) : "Unknown error",
        });
        results.push({ orderId: id, buyer: "failed", owner: "failed" });
      }
    }
    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error("PETIT.SOT email retry endpoint failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Could not process email retries" }, { status: 500 });
  }
}

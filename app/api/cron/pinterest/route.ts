import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publishArtworkPin } from "../../../../lib/pinterest";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.PINTEREST_ACCESS_LEVEL?.trim().toLowerCase() !== "standard") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Pinterest Trial access does not allow production pin creation. Automation is paused until Standard access is approved.",
      processed: 0,
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Missing Supabase server configuration." }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: artworks, error } = await supabase
    .from("petit_sot_artworks")
    .select("id,created_at")
    .eq("status", "available")
    .not("image_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: "Failed to load artworks." }, { status: 500 });
  }

  const results: { artworkId: string; status: string; error?: string; pinUrl?: string | null }[] = [];
  for (const artwork of artworks || []) {
    if (results.length >= 3) break;
    const { data: pin, error: pinError } = await supabase
      .from("petit_sot_pinterest_pins")
      .select("state")
      .eq("artwork_id", artwork.id)
      .maybeSingle();
    if (pinError) {
      results.push({ artworkId: artwork.id, status: "error", error: "Could not check existing pin state." });
      continue;
    }
    if (pin) continue;

    try {
      const result = await publishArtworkPin(supabase, artwork.id);
      results.push({ artworkId: artwork.id, status: result.status, pinUrl: result.pinUrl });
    } catch (err: any) {
      results.push({ artworkId: artwork.id, status: "error", error: String(err?.message || "Pinterest publish failed").slice(0, 500) });
      // A failed Pinterest request is not retried for every item in this run.
      break;
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}

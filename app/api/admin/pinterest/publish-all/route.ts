import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { publishArtworkPin } from "../../../../../lib/pinterest";

export async function POST() {
  const { supabase } = await requireAdmin();
  const { data: artworks, error } = await supabase
    .from("petit_sot_artworks")
    .select("id,title")
    .eq("status", "available")
    .order("published_at", { ascending: true });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const results: { title: string; status: string; pinUrl?: string; error?: string }[] = [];
  for (const artwork of artworks || []) {
    try {
      const result = await publishArtworkPin(supabase, artwork.id);
      results.push({ title: artwork.title, status: result.status, pinUrl: result.pinUrl });
    } catch (error: any) {
      results.push({ title: artwork.title, status: "error", error: error?.message || "Ошибка Pinterest" });
    }
  }
  const published = results.filter((item) => item.status === "published").length;
  const skipped = results.filter((item) => item.status === "skipped").length;
  const failed = results.filter((item) => item.status === "error").length;
  return NextResponse.json({ ok: failed === 0, published, skipped, failed, results });
}

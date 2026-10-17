import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { publishArtworkPin } from "../../../../../lib/pinterest";

export async function POST(request: Request) {
  const { supabase } = await requireAdmin();
  const body = await request.json().catch(() => ({}));
  const artworkId = String(body?.artworkId || "");
  if (!artworkId) return NextResponse.json({ ok: false, error: "Не указана картина." }, { status: 400 });
  try {
    const result = await publishArtworkPin(supabase, artworkId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    const message = error?.message || "Не удалось опубликовать пин Pinterest.";
    const status = message.includes("не подключён") || message.includes("не настроен") ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { getPinterestConnection } from "../../../../../lib/pinterest";

export async function GET() {
  const { supabase } = await requireAdmin();
  try {
    const connection = await getPinterestConnection(supabase);
    return NextResponse.json({
      connected: Boolean(connection?.access_token && connection?.refresh_token),
      expiresAt: connection?.expires_at || null,
      scope: connection?.scope || null,
      boards: connection?.board_ids || {},
      updatedAt: connection?.updated_at || null,
      appConfigured: Boolean(process.env.PINTEREST_APP_ID?.trim() && process.env.PINTEREST_APP_SECRET?.trim()),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Не удалось проверить Pinterest." }, { status: 500 });
  }
}

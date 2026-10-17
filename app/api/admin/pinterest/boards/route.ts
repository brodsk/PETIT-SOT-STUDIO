import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { ensurePinterestBoards, getPinterestConnection } from "../../../../../lib/pinterest";

export async function GET() {
  const { supabase } = await requireAdmin();
  try {
    const connection = await getPinterestConnection(supabase);
    if (!connection?.access_token) return NextResponse.json({ connected: false, boards: [] });
    const boards = await ensurePinterestBoards(supabase);
    return NextResponse.json({ connected: true, boards });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Не удалось получить доски Pinterest." }, { status: 500 });
  }
}

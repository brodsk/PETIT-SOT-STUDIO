import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "../../../../../lib/admin";
import { startPinterestOAuth } from "../../../../../lib/pinterest";

export async function GET(request: Request) {
  await requireAdmin();
  try {
    const { url, state } = startPinterestOAuth();
    const cookieStore = await cookies();
    cookieStore.set("pinterest_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return NextResponse.redirect(url);
  } catch (error: any) {
    const message = error?.message || "Не удалось начать подключение Pinterest.";
    return NextResponse.redirect(new URL("/admin/pinterest?error=" + encodeURIComponent(message), request.url));
  }
}

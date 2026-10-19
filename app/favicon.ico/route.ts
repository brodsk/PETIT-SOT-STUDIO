import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/favicon.png", request.url), 307, {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  });
}

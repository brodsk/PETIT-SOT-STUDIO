import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["en", "ru"] as const;
type Locale = (typeof LOCALES)[number];

function getPreferredLocale(request: NextRequest): Locale {
  return request.cookies.get("NEXT_LOCALE")?.value === "ru" ? "ru" : "en";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Apple Pay domain verification files must be served directly from /public,
  // without locale rewrites or redirects.
  if (pathname.startsWith("/.well-known/")) {
    return NextResponse.next();
  }

  const first = pathname.split("/").filter(Boolean)[0];

  // Public legal pages keep stable, unlocalized URLs.
  if (
    pathname === "/privacy-policy" ||
    pathname === "/image-licensing" ||
    pathname === "/return-policy"
  ) {
    return NextResponse.next();
  }

  // Keep locale handling local to middleware: do not make Supabase network
  // requests here. Protected pages and API handlers perform their own auth
  // checks, avoiding an external auth request on every admin/API navigation.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // English keeps clean URLs. Russian has explicit /ru URLs.
  if (first === "en") {
    const cleanPath = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    const response = NextResponse.redirect(url, 308);
    response.cookies.set("NEXT_LOCALE", "en", {
      path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax",
    });
    return response;
  }

  if (first === "ru") {
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", "ru", {
      path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax",
    });
    return response;
  }

  const locale = getPreferredLocale(request);
  if (locale === "ru") {
    const url = request.nextUrl.clone();
    url.pathname = `/ru${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 307);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|favicon\\.png|icon\\.svg|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)",
  ],
};

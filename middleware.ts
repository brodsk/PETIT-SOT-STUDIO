import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["en", "ru", "sk"] as const;
type Locale = (typeof LOCALES)[number];

function getPreferredLocale(request: NextRequest): Locale {
  const value = request.cookies.get("NEXT_LOCALE")?.value;
  return value === "ru" || value === "sk" ? value : "en";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/.well-known/")) return NextResponse.next();

  if (["/privacy-policy", "/image-licensing", "/return-policy"].includes(pathname)) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Keep the established Slovak SEO landing pages working at their original URLs.
  if (
    pathname === "/sk/obrazy" || pathname.startsWith("/sk/obrazy/") ||
    pathname === "/sk/malba-na-objednavku" ||
    pathname === "/sk/trencin-art-studio"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.rewrite(url);
  }

  const first = pathname.split("/").filter(Boolean)[0];

  if (first === "en") {
    const cleanPath = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    const response = NextResponse.redirect(url, 308);
    response.cookies.set("NEXT_LOCALE", "en", { path: "/", maxAge: 31536000, sameSite: "lax" });
    return response;
  }

  if (first === "ru" || first === "sk") {
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", first, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return response;
  }

  const locale = getPreferredLocale(request);
  if (locale !== "en") {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
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

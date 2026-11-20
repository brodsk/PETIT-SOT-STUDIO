import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["en", "ru", "sk"] as const;
type Locale = (typeof LOCALES)[number];

function applyRobotsHeader(response: NextResponse, isVercelHost: boolean) {
  if (isVercelHost) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function getPreferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get("NEXT_LOCALE")?.value;
  if (saved === "en" || saved === "ru" || saved === "sk") return saved;

  const accepted = request.headers.get("accept-language") ?? "";
  const preferences = accepted
    .split(",")
    .map((entry, index) => {
      const [tag, quality] = entry.trim().split(";q=");
      return {
        tag: tag.toLowerCase(),
        quality: quality === undefined ? 1 : Number.parseFloat(quality),
        index,
      };
    })
    .filter((entry) => Number.isFinite(entry.quality) && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const preference of preferences) {
    if (preference.tag === "sk" || preference.tag.startsWith("sk-")) return "sk";
    if (preference.tag === "ru" || preference.tag.startsWith("ru-")) return "ru";
    if (preference.tag === "en" || preference.tag.startsWith("en-")) return "en";
  }
  return "en";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isVercelHost = request.nextUrl.hostname.toLowerCase().endsWith(".vercel.app");
  const withRobots = (response: NextResponse) => applyRobotsHeader(response, isVercelHost);

  // Canonicalize artwork and wall-preview slugs before locale rewrites.
  const segments = pathname.split("/");
  const localeOffset = segments[1] === "ru" || segments[1] === "sk" ? 2 : 1;
  const routeName = segments[localeOffset];
  const slugIndex = localeOffset + 1;
  const oldSlug = segments[slugIndex];
  if (oldSlug && ["works", "obrazy", "wall-preview"].includes(routeName)) {
    const canonicalSlug = oldSlug.toLowerCase().replace(/_/g, "-");
    if (oldSlug !== canonicalSlug) {
      const url = request.nextUrl.clone();
      segments[slugIndex] = canonicalSlug;
      url.pathname = segments.join("/");
      return withRobots(NextResponse.redirect(url, 301));
    }
  }
  if (pathname.startsWith("/.well-known/")) return withRobots(NextResponse.next());

  if (["/privacy-policy", "/image-licensing", "/return-policy"].includes(pathname)) {
    return withRobots(NextResponse.next());
  }
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return withRobots(NextResponse.next());
  }

  // Keep the established Slovak SEO landing pages working at their original URLs.
  if (
    pathname === "/sk/obrazy" || pathname.startsWith("/sk/obrazy/") ||
    pathname === "/sk/malba-na-objednavku" ||
    pathname === "/sk/trencin-art-studio"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return withRobots(NextResponse.rewrite(url));
  }

  const first = pathname.split("/").filter(Boolean)[0];

  if (first === "en") {
    const cleanPath = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    const response = NextResponse.redirect(url, 308);
    response.cookies.set("NEXT_LOCALE", "en", { path: "/", maxAge: 31536000, sameSite: "lax" });
    return withRobots(response);
  }

  if (first === "ru" || first === "sk") {
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", first, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return withRobots(response);
  }

  const locale = getPreferredLocale(request);
  if (locale !== "en") {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.redirect(url, 307);
    response.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return withRobots(response);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.rewrite(url);
  if (!request.cookies.get("NEXT_LOCALE")) {
    response.cookies.set("NEXT_LOCALE", "en", { path: "/", maxAge: 31536000, sameSite: "lax" });
  }
  return withRobots(response);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|favicon\\.png|icon\\.svg|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)",
  ],
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["en", "ru"] as const;
type Locale = (typeof LOCALES)[number];

function getPreferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookie === "ru" || cookie === "en") return cookie;
  const accept = request.headers.get("accept-language")?.toLowerCase() || "";
  return accept.includes("ru") ? "ru" : "en";
}

async function withSupabase(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  await supabase.auth.getUser();
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/").filter(Boolean)[0];

  if (first === "en" || first === "ru") {
    const locale = first as Locale;
    const cleanPath = pathname.replace(/^\/(?:en|ru)(?=\/|$)/, "") || "/";
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;

    const response = NextResponse.redirect(url, 308);
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return withSupabase(request);
  }

  const locale = getPreferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

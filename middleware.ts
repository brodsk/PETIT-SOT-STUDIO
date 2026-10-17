import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["en", "ru"] as const;
type Locale = (typeof LOCALES)[number];

function getPreferredLocale(request: NextRequest): Locale {
  return request.cookies.get("NEXT_LOCALE")?.value === "ru" ? "ru" : "en";
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

  // Public legal pages must remain unlocalized so external services (including Pinterest)
  // can access their canonical URLs without being rewritten to /en or /ru.
  if (pathname === "/privacy-policy") {
    return NextResponse.next();
  }

  // English keeps clean URLs. Russian has explicit /ru URLs so search engines
  // can index both language versions independently.
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

  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return withSupabase(request);
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
  matcher: ["/admin/:path*", "/api/:path*", "/((?!_next/static|_next/image|favicon.ico|favicon.svg|favicon.png|icon.svg|robots.txt|sitemap.xml).*)"],
};

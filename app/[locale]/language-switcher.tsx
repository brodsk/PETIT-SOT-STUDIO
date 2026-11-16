"use client";
import { usePathname } from "next/navigation";

export default function LanguageSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname() || "/";
  const legacySlovak = pathname === "/sk/obrazy" || pathname.startsWith("/sk/obrazy/") || pathname === "/sk/malba-na-objednavku" || pathname === "/sk/trencin-art-studio";
  const cleanPath = legacySlovak ? "/" : pathname.replace(/^\/(?:en|ru|sk)(?=\/|$)/, "") || "/";
  const target = (language: string) => language === "en" ? cleanPath : `/${language}${cleanPath === "/" ? "" : cleanPath}`;
  const switchLanguage = (language: string) => {
    document.cookie = `NEXT_LOCALE=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
  };
  return (
    <span className="language" aria-label="Language">
      {(["en", "ru", "sk"] as const).map((language, index) => (
        <span key={language}>
          {index > 0 && <i aria-hidden="true"> / </i>}
          <a href={target(language)} onClick={() => switchLanguage(language)} className={locale === language ? "active" : ""} lang={language} aria-current={locale === language ? "page" : undefined}>{language.toUpperCase()}</a>
        </span>
      ))}
    </span>
  );
}

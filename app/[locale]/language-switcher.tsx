"use client";
import { usePathname } from "next/navigation";

export default function LanguageSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname() || "/";
  const legacyArtwork = pathname.match(/^\/sk\/obrazy\/([^/]+)\/?$/);
  const legacyCatalogue = pathname === "/sk/obrazy" || pathname === "/sk/obrazy/";
  const legacyCommission = pathname === "/sk/malba-na-objednavku";
  const legacyStudio = pathname === "/sk/trencin-art-studio";
  const activeLocale = legacyArtwork || legacyCatalogue || legacyCommission || legacyStudio ? "sk" : locale;

  const target = (language: string) => {
    if (legacyArtwork) {
      if (language === "sk") return pathname;
      return `${language === "ru" ? "/ru" : ""}/works/${legacyArtwork[1]}`;
    }
    if (legacyCatalogue) {
      if (language === "sk") return "/sk/obrazy";
      return `${language === "ru" ? "/ru" : ""}/works`;
    }
    if (legacyCommission) {
      if (language === "sk") return pathname;
      return `${language === "ru" ? "/ru" : ""}/commission`;
    }
    if (legacyStudio) {
      if (language === "sk") return pathname;
      return `${language === "ru" ? "/ru" : ""}/about`;
    }
    const cleanPath = pathname.replace(/^\/(?:en|ru|sk)(?=\/|$)/, "") || "/";
    return language === "en" ? cleanPath : `/${language}${cleanPath === "/" ? "" : cleanPath}`;
  };

  const switchLanguage = (language: string) => {
    document.cookie = `NEXT_LOCALE=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
  };

  return (
    <span className="language" aria-label="Language">
      {(["en", "ru", "sk"] as const).map((language, index) => (
        <span key={language}>
          {index > 0 && <i aria-hidden="true"> / </i>}
          <a href={target(language)} onClick={() => switchLanguage(language)} className={activeLocale === language ? "active" : ""} lang={language} aria-current={activeLocale === language ? "page" : undefined}>{language.toUpperCase()}</a>
        </span>
      ))}
    </span>
  );
}

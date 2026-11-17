"use client";
import { usePathname } from "next/navigation";

export default function LanguageSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname() || "/";
  const legacyArtwork = pathname.match(/^\\/sk\\/obrazy\\/([^/]+)\\/?$/);
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
    const cleanPath = pathname.replace(/^\\/(?:en|ru|sk)(?=\\/|$)/, "") || "/";
    return language === "en" ? cleanPath : `/${language}${cleanPath === "/" ? "" : cleanPath}`;
  };

  const switchLanguage = (language: string) => {
    document.cookie = `NEXT_LOCALE=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
  };

  const labels = { en: "English", ru: "Русский", sk: "Slovenčina" } as const;
  const current = activeLocale in labels ? labels[activeLocale as keyof typeof labels] : "Language";

  return (
    <details
      className="language language-dropdown"
      style={{ position: "relative", display: "inline-block", marginLeft: 8, whiteSpace: "nowrap" }}
    >
      <summary
        aria-label={`Language: ${current}. Choose language`}
        style={{
          cursor: "pointer",
          listStyle: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 10px",
          border: "1px solid rgba(23,23,23,.22)",
          borderRadius: 2,
          fontSize: "inherit",
          lineHeight: 1.2,
          background: "transparent",
          color: "inherit",
          userSelect: "none",
        }}
      >
        <span>{activeLocale.toUpperCase()}</span>
        <span aria-hidden="true" style={{ fontSize: 9, opacity: .55 }}>▾</span>
      </summary>
      <div
        role="group"
        aria-label="Choose language"
        style={{
          position: "absolute",
          zIndex: 30,
          top: "calc(100% + 7px)",
          right: 0,
          minWidth: 142,
          padding: 5,
          background: "#f7f6f2",
          border: "1px solid rgba(23,23,23,.18)",
          boxShadow: "0 8px 24px rgba(0,0,0,.09)",
        }}
      >
        {(["en", "ru", "sk"] as const).map((language) => (
          <a
            key={language}
            href={target(language)}
            onClick={() => switchLanguage(language)}
            lang={language}
            aria-current={activeLocale === language ? "page" : undefined}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              padding: "10px 11px",
              color: "inherit",
              textDecoration: "none",
              fontSize: 12,
              letterSpacing: ".04em",
              opacity: activeLocale === language ? 1 : .72,
              fontWeight: activeLocale === language ? 600 : 400,
            }}
          >
            <span>{labels[language]}</span>
            <span style={{ fontSize: 10, opacity: .55 }}>{language.toUpperCase()}</span>
          </a>
        ))}
      </div>
    </details>
  );
}

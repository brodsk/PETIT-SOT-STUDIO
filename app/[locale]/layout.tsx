import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LanguageSwitcher from "./language-switcher";
import BackToTop from "../components/BackToTop";

const SITE_URL = "https://petitsot.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";

  return {
    title: ru ? "Ольга Трихлеб — художница" : "Olga Trikhleb — Contemporary Artist",
    description: ru
      ? "Официальный сайт художницы Ольги Трихлеб: живопись, визуальные исследования и доступные работы."
      : "Official portfolio of contemporary artist Olga Trikhleb: paintings, visual research and selected available works.",
    alternates: {
      languages: {
        en: `${SITE_URL}/en`,
        ru: `${SITE_URL}/ru`,
        "x-default": `${SITE_URL}/en`,
      },
    },
    openGraph: {
      title: ru ? "Ольга Трихлеб — художница" : "Olga Trikhleb — Contemporary Artist",
      description: ru
        ? "Живопись, визуальные исследования и работы Ольги Трихлеб."
        : "Paintings, visual research and selected works by Olga Trikhleb.",
      url: `${SITE_URL}/${locale}`,
      locale: ru ? "ru_RU" : "en_GB",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ru") notFound();
  const ru = locale === "ru";

  return (
    <div data-locale={locale} lang={locale}>
      <header className="site-header">
        <Link href={"/" + locale} className="wordmark">
          PETIT.SOT <span className="wordmark-divider">|</span> <span>STUDIO</span>
        </Link>
        <nav>
          <Link href={"/" + locale + "/works"}>{ru ? "Работы" : "Works"}</Link>
          <Link href={"/" + locale + "/about"}>{ru ? "О студии" : "About"}</Link>
          <Link href={"/" + locale + "/contact"}>{ru ? "Контакты" : "Contact"}</Link>
          <LanguageSwitcher locale={locale} />
        </nav>
      </header>
      {children}
      <BackToTop />
      <footer>
        <span>© {new Date().getFullYear()} PETIT.SOT STUDIO</span>
        <span>Olga Trikhleb</span>
        <a href="https://www.instagram.com/petit.sot/" target="_blank" rel="noreferrer">
          Instagram ↗
        </a>
      </footer>
    </div>
  );
}

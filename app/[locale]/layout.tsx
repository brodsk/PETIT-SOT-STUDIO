import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LanguageSwitcher from "./language-switcher";
import BackToTop from "../components/BackToTop";
import MotionEffects from "../components/MotionEffects";

const SITE_URL = "https://www.petitsot.com";

const copy = {
  en: { title: "Olga Trikhleb — Contemporary Artist", description: "Official portfolio of contemporary artist Olga Trikhleb: original paintings, artistic practice and selected available works.", works: "Works", prints: "Fine Art Prints", commission: "Commission", journal: "Journal", about: "About", contact: "Contact", artist: "About the artist", legal: "Legal information", licensing: "Image Licensing", privacy: "Privacy Policy", returns: "Returns & Refunds" },
  ru: { title: "Ольга Трихлеб — художница", description: "Официальный сайт художницы Ольги Трихлеб: оригинальная живопись, авторские картины и доступные работы.", works: "Работы", prints: "Репродукции", commission: "На заказ", journal: "Журнал", about: "О студии", contact: "Контакты", artist: "О художнице", legal: "Юридическая информация", licensing: "Лицензирование изображений", privacy: "Конфиденциальность", returns: "Возвраты и возврат средств" },
  sk: { title: "Olga Trikhleb — súčasná výtvarníčka", description: "Oficiálna stránka výtvarníčky Olgy Trikhleb. Objavte originálne obrazy, umeleckú tvorbu a dostupné diela v PETIT.SOT STUDIO.", works: "Diela", prints: "Umelecké reprodukcie", commission: "Maľba na objednávku", journal: "Články", about: "O autorke", contact: "Kontakt", artist: "O autorke", legal: "Právne informácie", licensing: "Licencia k obrázkom", privacy: "Ochrana súkromia", returns: "Vrátenie tovaru a peňazí" },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!(locale in copy)) return {};
  const lang = locale as keyof typeof copy;
  const canonical = locale === "en" ? SITE_URL : `${SITE_URL}/${locale}`;
  return {
    title: copy[lang].title,
    description: copy[lang].description,
    alternates: { canonical, languages: { en: SITE_URL, ru: `${SITE_URL}/ru`, sk: `${SITE_URL}/sk`, "x-default": SITE_URL } },
    openGraph: { title: copy[lang].title, description: copy[lang].description, url: canonical, locale: locale === "ru" ? "ru_RU" : locale === "sk" ? "sk_SK" : "en_GB" },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(locale in copy)) notFound();
  const lang = locale as keyof typeof copy;
  const t = copy[lang];
  return (
    <div data-locale={locale} lang={locale}>
      <header className="site-header">
        <Link href={locale === "en" ? "/" : `/${locale}`} className="wordmark">
          PETIT.SOT <span className="wordmark-divider">|</span> <span>STUDIO</span>
        </Link>
        <nav>
          <Link href="/works">{t.works}</Link>
          <Link href="/prints">{t.prints}</Link>
          <Link href="/commission">{t.commission}</Link>
          <Link href="/journal">{t.journal}</Link>
          <Link href="/about">{t.about}</Link>
          <Link href="/contact">{t.contact}</Link>
          <LanguageSwitcher locale={locale} />
        </nav>
      </header>
      {children}
      <MotionEffects />
      <BackToTop />
      <footer>
        <span>© {new Date().getFullYear()} PETIT.SOT STUDIO</span>
        <Link href="/about">{t.artist}</Link>
        <a href="https://www.instagram.com/petit.sot.art" target="_blank" rel="noreferrer">Instagram ↗</a>
        <nav aria-label={t.legal} className="footer-legal-links" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <Link href={locale === "sk" ? "/sk/image-licensing" : "/image-licensing"}>{t.licensing}</Link>
          <Link href={locale === "sk" ? "/sk/privacy-policy" : "/privacy-policy"}>{t.privacy}</Link>
          <Link href={locale === "sk" ? "/sk/return-policy" : "/return-policy"}>{t.returns}</Link>
        </nav>
      </footer>
    </div>
  );
}

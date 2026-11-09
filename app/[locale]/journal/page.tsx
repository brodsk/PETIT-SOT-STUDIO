import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru ? "Гид по оригинальному искусству и живописи | PETIT.SOT" : "Original Art & Painting Guides | PETIT.SOT STUDIO";
  const description = ru
    ? "Практические статьи об оригинальных картинах: как выбрать произведение для интерьера, чем оригинал отличается от принта и как ухаживать за живописью."
    : "Practical guides to original art: how to choose a painting for your home, original artwork vs prints, and how to care for an original painting.";
  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/journal`;
  return {
    title, description,
    alternates: { canonical, languages: { en: `${SITE_URL}/journal`, ru: `${SITE_URL}/ru/journal`, "x-default": `${SITE_URL}/journal` } },
    openGraph: { type: "website", title, description, url: canonical, siteName: "PETIT.SOT STUDIO" },
  };
}

const guides = [
  {
    slug: "how-to-choose-an-original-painting",
    en: { title: "How to Choose an Original Painting for Your Home", description: "A thoughtful guide to scale, colour, subject, placement and choosing artwork that feels right in your space." },
    ru: { title: "Как выбрать оригинальную картину для дома", description: "Практическое руководство: размер, цвет, сюжет, размещение и выбор картины, которая будет близка именно вам." },
  },
  {
    slug: "original-art-vs-print",
    en: { title: "Original Art vs Art Prints: What Is the Difference?", description: "Understand the difference between a one-of-a-kind original painting and a printed reproduction." },
    ru: { title: "Оригинальная картина или принт: в чём разница?", description: "Разбираемся, чем уникальная авторская работа отличается от печатной репродукции." },
  },
  {
    slug: "how-to-care-for-an-original-painting",
    en: { title: "How to Care for an Original Painting", description: "Simple, careful ways to protect paintings on canvas and paper from light, dust and environmental changes." },
    ru: { title: "Как ухаживать за оригинальной картиной", description: "Как беречь живопись на холсте и бумаге от света, пыли и перепадов окружающей среды." },
  },
];

export default async function JournalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  return (
    <main className="text-page about-page">
      <section className="about-hero">
        <p className="eyebrow">PETIT.SOT STUDIO · {ru ? "РЕСУРСЫ" : "RESOURCES"}</p>
        <h1>{ru ? <>Искусство<br /><i>понятнее.</i></> : <>Art,<br /><i>considered.</i></>}</h1>
        <div className="about-lead">
          <span className="about-index">PETIT.SOT / JOURNAL</span>
          <p>{ru
            ? "Небольшая библиотека практических материалов об оригинальном искусстве, выборе картин и заботе о произведениях."
            : "A growing library of practical notes on original art, choosing paintings and caring for the works you live with."}</p>
        </div>
      </section>
      <section className="works-section">
        <div className="works-section-heading">
          <span className="eyebrow">{ru ? "СТАТЬИ И РУКОВОДСТВА" : "ARTICLES & GUIDES"}</span>
          <h2>{ru ? "Полезно знать" : "Useful to know"}</h2>
        </div>
        <div className="archive-grid archive-grid-even">
          {guides.map((guide, index) => {
            const item = ru ? guide.ru : guide.en;
            return (
              <Link className="archive-card" href={`/journal/${guide.slug}`} key={guide.slug}>
                <div className="archive-image art-placeholder"><span>{String(index + 1).padStart(2, "0")}</span><small>{ru ? "РУКОВОДСТВО" : "GUIDE"}</small></div>
                <div className="archive-card-meta"><span>{item.title}</span><span>↗</span></div>
                <p>{item.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="about-originals">
        <p className="eyebrow">PETIT.SOT STUDIO · TRENČÍN, SLOVAKIA</p>
        <p className="about-originals-statement">{ru ? "Оригинальная живопись Ольги Трихлеб." : "Original paintings by Olga Trikhleb."}</p>
        <div className="about-originals-bottom">
          <span>{ru ? "Независимая художественная студия" : "Independent art studio"}</span>
          <Link className="arrow-link" href="/works">{ru ? "Открыть каталог" : "Explore the collection"} <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}

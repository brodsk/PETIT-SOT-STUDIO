import type { Metadata } from "next";
import Link from "next/link";
import { getWorks } from "../../../lib/works";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru ? "Статьи об искусстве и оригинальной живописи | PETIT.SOT" : "Art & Original Painting Journal | PETIT.SOT STUDIO";
  const description = ru
    ? "Практические статьи о выборе оригинальной картины, заказе авторской живописи, размещении работ в интерьере и уходе за ними."
    : "Thoughtful, practical articles on choosing original paintings, commissioning artwork, displaying art at home and caring for the works you live with.";
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
    slug: "how-to-hang-a-painting",
    en: { title: "How to Hang a Painting: Height, Space and Placement", description: "A clear guide to choosing the right wall, hanging height and spacing so an artwork feels balanced in your room." },
    ru: { title: "Как повесить картину: высота, место и композиция", description: "Как выбрать стену, высоту и расстояние вокруг картины, чтобы она гармонично смотрелась в интерьере." },
  },
  {
    slug: "commission-an-original-painting",
    en: { title: "How to Commission an Original Painting", description: "What to consider before commissioning a painting, from size and subject to references, timing and the creative process." },
    ru: { title: "Как заказать оригинальную картину", description: "Что важно обсудить перед заказом: размер, сюжет, референсы, сроки и этапы создания авторской работы." },
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
  const works = await getWorks();
  const preferredImages: Record<string, string[]> = {
    "how-to-hang-a-painting": ["evening", "meadow", "nice"],
    "commission-an-original-painting": ["sunset", "road", "angel"],
    "how-to-choose-an-original-painting": ["meadow", "evening", "sunset"],
    "original-art-vs-print": ["rain", "angel", "mallorca"],
    "how-to-care-for-an-original-painting": ["road", "road-in-the-fog", "tuman"],
  };
  const imageFor = (slug: string) => {
    const preferred = preferredImages[slug] || [];
    const work = preferred.map((key) => works.find((item) => item.slug.toLowerCase() === key && (item.imageUrl || item.thumbnailUrl))).find(Boolean)
      || works.find((item) => item.imageUrl || item.thumbnailUrl);
    return work ? { src: work.imageUrl || work.thumbnailUrl!, alt: (ru ? work.titleRu : work.titleEn) + " — " + (ru ? "оригинальная картина Ольги Трихлеб" : "original painting by Olga Trikhleb") } : null;
  };
  return (
    <main className="text-page journal-page">
      <section className="journal-hero">
        <p className="eyebrow">PETIT.SOT STUDIO · {ru ? "ЖУРНАЛ" : "JOURNAL"}</p>
        <h1><i>{ru ? <>Об искусстве<br />и живописи.</> : <>Art &amp;<br />painting.</>}</i></h1>
        <div className="about-lead">
          <span className="about-index">PETIT.SOT / JOURNAL</span>
          <p>{ru
            ? "Практические статьи о том, как выбирать оригинальные картины, заказывать живопись и заботиться о произведениях искусства."
            : "Practical articles on choosing original paintings, commissioning artwork, displaying it at home and caring for the works you live with."}</p>
        </div>
      </section>
      <section className="works-section">
        <div className="works-section-heading">
          <span className="eyebrow">{ru ? "ЖУРНАЛ PETIT.SOT" : "THE PETIT.SOT JOURNAL"}</span>
          <h2>{ru ? "Статьи о живописи" : "Explore the articles"}</h2>
        </div>
        <div className="archive-grid archive-grid-even journal-grid">
          {guides.map((guide, index) => {
            const item = ru ? guide.ru : guide.en;
            return (
              <Link className="archive-card" href={`/journal/${guide.slug}`} key={guide.slug}>
                <div className="archive-image journal-card-image">
                  {imageFor(guide.slug) ? <img src={imageFor(guide.slug)!.src} alt={imageFor(guide.slug)!.alt} loading="lazy" decoding="async" /> : <div className="journal-image-fallback"><span>{String(index + 1).padStart(2, "0")}</span><small>{ru ? "РУКОВОДСТВО" : "GUIDE"}</small></div>}
                </div>
                <div className="archive-card-meta"><span>{item.title}</span><span>↗</span></div>
                <p>{item.description}</p>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="about-originals">
        <p className="eyebrow">PETIT.SOT STUDIO · {ru ? "ОРИГИНАЛЬНЫЕ РАБОТЫ" : "ORIGINAL PAINTINGS"}</p>
        <p className="about-originals-statement">{ru ? "Оригинальная живопись Ольги Трихлеб." : "Original paintings by Olga Trikhleb."}</p>
        <div className="about-originals-bottom">
          <span>{ru ? "Независимая художественная студия" : "Independent art studio"}</span>
          <Link className="arrow-link" href="/works">{ru ? "Открыть каталог" : "Explore the collection"} <span>↗</span></Link>
          <Link className="arrow-link" href="/commission">{ru ? "Заказать картину" : "Commission a painting"} <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}

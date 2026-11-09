import type { Metadata } from "next";
import Link from "next/link";
import { getWorks, localizeMedium } from "../../../lib/works";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru ? "Оригинальные картины Ольги Трихлеб — художница из Тренчина" : "Original Paintings by Olga Trikhleb — Trenčín Artist";
  const description = ru
    ? "Оригинальная живопись Ольги Трихлеб, независимой художницы из Тренчина, Словакия. Городские сцены, пейзажи и современные картины."
    : "Explore original paintings by Olga Trikhleb, an independent artist based in Trenčín, Slovakia. Discover contemporary paintings, city scenes and landscapes.";

  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/works`;
  const works = await getWorks();
  const previewWork = works.find((work) => work.imageUrl);
  const previewImage = previewWork?.imageUrl;
  const previewAlt = previewWork
    ? `${ru ? previewWork.titleRu : previewWork.titleEn} — ${ru ? "оригинальная картина Ольги Трихлеб" : "original painting by Olga Trikhleb"}`
    : (ru ? "Оригинальные картины Ольги Трихлеб" : "Original paintings by Olga Trikhleb");

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/works`,
        ru: `${SITE_URL}/ru/works`,
        "x-default": `${SITE_URL}/works`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "PETIT.SOT STUDIO",
      locale: ru ? "ru_RU" : "en_GB",
      ...(previewImage ? { images: [{ url: previewImage, alt: previewAlt }] } : {}),
    },
    twitter: {
      card: previewImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(previewImage ? { images: [previewImage] } : {}),
    },
  };
}

export default async function Works({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  const works = await getWorks();
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: ru ? "Главная" : "Home",
        item: `${SITE_URL}${ru ? "/ru" : ""}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: ru ? "Работы" : "Works",
        item: `${SITE_URL}${ru ? "/ru" : ""}/works`,
      },
    ],
  };
  return <main className="archive gallery-archive">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div className="archive-mast"><span className="eyebrow">{ru ? "Архив · Тренчин, Словакия" : "Archive · Trenčín, Slovakia"}</span><h1>{ru ? "Работы" : "Works"}</h1><p>{ru ? "Оригинальные картины Ольги Трихлеб — независимой художницы из Тренчина: городские сцены, пейзажи и повседневные сюжеты. У каждой работы указаны техника, размер, год и доступность." : "Explore original paintings by Olga Trikhleb, an independent Trenčín-based artist, from city scenes and landscapes to everyday moments. Each work includes its medium, size, year and availability."}</p></div>
    {(() => {
      const availableWorks = works.filter((work) => work.available);
      const archivedWorks = works.filter((work) => !work.available);
      const renderCards = (items: typeof works) => <div className="archive-grid archive-grid-even">
        {items.map((w, i) => <Link className="archive-card" href={"/works/" + w.slug} key={w.slug}>
          <div className="archive-image art-placeholder">{w.imageUrl ? <img src={w.imageUrl} alt={(ru ? w.titleRu : w.titleEn) + " — " + localizeMedium(w.medium, ru ? "ru" : "en") + ", " + w.year + (ru ? ", оригинальная картина Ольги Трихлеб" : ", original painting by Olga Trikhleb")} loading="lazy" decoding="async" /> : <><span>{String(i + 1).padStart(2, "0")}</span><small>IMAGE</small></>}</div>
          <div className="archive-card-meta"><span>{ru ? w.titleRu : w.titleEn}</span><span>{w.year}</span></div>
          <p>{localizeMedium(w.medium, ru ? "ru" : "en")}</p>
          {!w.available && <span className={`archive-card-status ${w.sold ? "archive-card-sold" : ""}`}>{w.sold ? (ru ? "ПРОДАНА" : "SOLD") : (ru ? "Архив · цена по запросу" : "Archive · price on request")}</span>}
        </Link>)}
      </div>;
      return <>
        {availableWorks.length > 0 && <section className="works-section"><div className="works-section-heading"><span className="eyebrow">{ru ? "ДОСТУПНЫЕ РАБОТЫ" : "AVAILABLE WORKS"}</span><h2>{ru ? "В продаже" : "For sale"}</h2></div>{renderCards(availableWorks)}</section>}
        {archivedWorks.length > 0 && <section className="works-section works-archive-section"><div className="works-section-heading"><span className="eyebrow">{ru ? "ЗАВЕРШЁННЫЕ И НЕДОСТУПНЫЕ РАБОТЫ" : "PAST & UNAVAILABLE WORKS"}</span><h2>{ru ? "Архив" : "Archive"}</h2><p>{ru ? "Эти работы сейчас не продаются. Если вас заинтересовала одна из них, отправьте запрос о стоимости или возможном заказе." : "These works are not currently for sale. Contact us to enquire about pricing or a possible commission."}</p></div>{renderCards(archivedWorks)}</section>}
        {works.length === 0 && <p className="works-empty">{ru ? "Работы скоро появятся." : "Artworks will be added soon."}</p>}
      </>;
    })()}
  </main>;
}

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
  const title = ru ? "Оригинальные картины — Ольга Трихлеб" : "Original Paintings by Olga Trikhleb";
  const description = ru
    ? "Оригинальные картины Ольги Трихлеб: городские сцены, пейзажи и повседневные сюжеты. Посмотрите размеры, технику и варианты покупки."
    : "Explore original paintings by Olga Trikhleb, from city scenes to landscapes. View each artwork’s medium, size and purchase options.";

  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/works`;

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
    openGraph: { title, description, url: canonical },
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
    <div className="archive-mast"><span className="eyebrow">{ru ? "Архив" : "Archive"}</span><h1>{ru ? "Работы" : "Works"}</h1><p>{ru ? "Картины и визуальные исследования Ольги Трихлеб." : "Paintings and visual research by Olga Trikhleb."}</p></div>
    <div className="archive-grid archive-grid-even">
      {works.map((w, i) => <Link className="archive-card" href={"/works/" + w.slug} key={w.slug}>
        <div className="archive-image art-placeholder">{w.imageUrl ? <img src={w.imageUrl} alt={(ru ? w.titleRu : w.titleEn) + (ru ? " — оригинальная картина Ольги Трихлеб" : " — original painting by Olga Trikhleb")} loading="lazy" decoding="async" /> : <><span>{String(i + 1).padStart(2, "0")}</span><small>IMAGE</small></>}</div>
        <div className="archive-card-meta"><span>{ru ? w.titleRu : w.titleEn}</span><span>{w.year}</span></div>
        <p>{localizeMedium(w.medium, ru ? "ru" : "en")}</p>
      </Link>)}
    </div>
  </main>;
}

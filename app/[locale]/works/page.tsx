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
  const sk = locale === "sk";
  const title = ru ? "Купить оригинальные картины Ольги Трихлеб" : sk ? "Originálne obrazy na predaj | Olga Trikhleb" : "Original Paintings for Sale Online | Olga Trikhleb";
  const description = ru
    ? "Оригинальные картины Ольги Трихлеб в продаже онлайн. Авторская живопись, пейзажи, морские и городские сюжеты, картины для интерьера. Информация о размерах, стоимости и наличии."
    : sk ? "Prezrite si originálne obrazy súčasnej výtvarníčky Olgy Trikhleb. Objavte jedinečné krajiny, morské a mestské motívy, rozmery, techniky, ceny a dostupnosť diel." : "Browse original paintings for sale online by contemporary artist Olga Trikhleb. Discover one-of-a-kind landscape, seascape and city artwork for modern interiors, with dimensions, materials, prices and availability.";

  const canonical = `${SITE_URL}${ru ? "/ru" : sk ? "/sk" : ""}/works`;
  const works = await getWorks();
  const previewWork = works.find((work) => work.imageUrl);
  const previewImage = previewWork?.imageUrl;
  const previewAlt = previewWork
    ? `${ru ? previewWork.titleRu : sk ? previewWork.titleSk : previewWork.titleEn} — ${ru ? "оригинальная картина Ольги Трихлеб" : sk ? "originálny obraz Olgy Trikhleb" : "original painting by Olga Trikhleb"}`
    : (ru ? "Оригинальные картины Ольги Трихлеб" : sk ? "Originálne obrazy Olgy Trikhleb" : "Original paintings by Olga Trikhleb");

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/works`,
        ru: `${SITE_URL}/ru/works`,
        sk: `${SITE_URL}/sk/works`,
        "x-default": `${SITE_URL}/works`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "PETIT.SOT STUDIO",
      locale: ru ? "ru_RU" : sk ? "sk_SK" : "en_GB",
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
  const sk = locale === "sk";
  const works = await getWorks();
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: ru ? "Главная" : sk ? "Domov" : "Home",
        item: `${SITE_URL}${ru ? "/ru" : sk ? "/sk" : ""}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: ru ? "Работы" : sk ? "Diela" : "Works",
        item: `${SITE_URL}${ru ? "/ru" : sk ? "/sk" : ""}/works`,
      },
    ],
  };
  return <main className="archive gallery-archive">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div className="archive-mast"><span className="eyebrow">{ru ? "PETIT.SOT / КОЛЛЕКЦИЯ" : sk ? "PETIT.SOT / KOLEKCIA" : "PETIT.SOT / COLLECTION"}</span><h1>{ru ? "Оригинальные картины" : sk ? "Originálne obrazy" : "Original paintings"}</h1><p>{ru ? "Оригинальные картины Ольги Трихлеб в продаже: авторская живопись, пейзажи, морские и городские сюжеты для дома и интерьера. У каждой работы указаны техника, размер, год, стоимость и доступность." : sk ? "Objavte originálne obrazy výtvarníčky Olgy Trikhleb. Prezrite si jedinečné krajiny, morské a mestské scenérie. Pri každom diele nájdete techniku, rozmery, rok a aktuálnu dostupnosť." : "Discover original paintings for sale online by artist Olga Trikhleb. Explore one-of-a-kind landscapes, seascapes and city scenes for contemporary interiors. Each artwork includes its medium, dimensions, year and current availability."}</p></div>
    {(() => {
      const availableWorks = works.filter((work) => work.available);
      const archivedWorks = works.filter((work) => !work.available);
      const renderCards = (items: typeof works) => <div className="archive-grid archive-grid-even">
        {items.map((w, i) => <Link className="archive-card" href={"/works/" + w.slug} key={w.slug}>
          <div className="archive-image art-placeholder">{w.thumbnailUrl ? <img src={w.thumbnailUrl} alt={(ru ? w.titleRu : sk ? w.titleSk : w.titleEn) + " — " + localizeMedium(w.medium, ru ? "ru" : sk ? "sk" : "en") + ", " + w.year + (ru ? ", оригинальная картина Ольги Трихлеб" : sk ? ", originálny obraz Olgy Trikhleb" : ", original painting by Olga Trikhleb")} loading="lazy" decoding="async" /> : <><span>{String(i + 1).padStart(2, "0")}</span><small>IMAGE</small></>}</div>
          <div className="archive-card-meta"><span>{ru ? w.titleRu : w.titleEn}</span><span>{w.year}</span></div>
          <p>{localizeMedium(w.medium, ru ? "ru" : sk ? "sk" : "en")}</p>
          {!w.available && <span className={`archive-card-status ${w.sold ? "archive-card-sold" : ""}`}>{w.sold ? (ru ? "ПРОДАНА" : "SOLD") : (ru ? "Архив · цена по запросу" : "Archive · price on request")}</span>}
        </Link>)}
      </div>;
      return <>
        {availableWorks.length > 0 && <section className="works-section"><div className="works-section-heading"><span className="eyebrow">{ru ? "ДОСТУПНЫЕ РАБОТЫ" : sk ? "DOSTUPNÉ DIELA" : "AVAILABLE WORKS"}</span><h2>{ru ? "В продаже" : sk ? "Na predaj" : "For sale"}</h2></div>{renderCards(availableWorks)}</section>}
        {archivedWorks.length > 0 && <section className="works-section works-archive-section"><div className="works-section-heading"><span className="eyebrow">{ru ? "ЗАВЕРШЁННЫЕ И НЕДОСТУПНЫЕ РАБОТЫ" : sk ? "PREDCHÁDZAJÚCE A NEDOSTUPNÉ DIELA" : "PAST & UNAVAILABLE WORKS"}</span><h2>{ru ? "Архив" : sk ? "Archív" : "Archive"}</h2><p>{ru ? "Эти работы сейчас не продаются. Если вас заинтересовала одна из них, отправьте запрос о стоимости или возможном заказе." : sk ? "Tieto diela momentálne nie sú na predaj. Ak vás niektoré zaujalo, kontaktujte nás a informujte sa o cene alebo možnosti objednať podobný obraz." : "These works are not currently for sale. Contact us to enquire about pricing or a possible commission."}</p></div>{renderCards(archivedWorks)}</section>}
        {works.length === 0 && <p className="works-empty">{ru ? "Работы скоро появятся." : sk ? "Čoskoro pribudnú nové diela." : "Artworks will be added soon."}</p>}
      </>;
    })()}
  </main>;
}

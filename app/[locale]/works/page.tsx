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

  const canonical = sk ? `${SITE_URL}/sk/obrazy` : `${SITE_URL}${ru ? "/ru" : ""}/works`;
  const works = await getWorks();
  const previewWork = works.find((work) => work.imageUrl);
  const previewImage = previewWork?.imageUrl;
  const previewAlt = previewWork
    ? previewWork.imageAlts[ru ? "ru" : sk ? "sk" : "en"][0]
    : (ru ? "Оригинальные картины Ольги Трихлеб" : sk ? "Originálne obrazy Olgy Trikhleb" : "Original paintings by Olga Trikhleb");

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/works`,
        ru: `${SITE_URL}/ru/works`,
        sk: `${SITE_URL}/sk/obrazy`,
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

export default async function Works({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status: requestedStatus } = await searchParams;
  const ru = locale === "ru";
  const sk = locale === "sk";
  const status = requestedStatus === "available" || requestedStatus === "sold" ? requestedStatus : "all";
  const works = await getWorks();
  const visibleWorks = works.filter((work) => {
    if (status === "available") return work.available;
    if (status === "sold") return work.sold;
    return true;
  });
  const labels = ru
    ? { all: "Все", available: "В продаже", sold: "Проданные", count: "работ", availableStatus: "В ПРОДАЖЕ", soldStatus: "ПРОДАНА", archiveStatus: "АРХИВ", request: "Цена по запросу" }
    : sk
      ? { all: "Všetky", available: "Dostupné", sold: "Predané", count: "diel", availableStatus: "DOSTUPNÉ", soldStatus: "PREDANÉ", archiveStatus: "ARCHÍV", request: "Cena na vyžiadanie" }
      : { all: "All", available: "Available", sold: "Sold", count: "works", availableStatus: "AVAILABLE", soldStatus: "SOLD", archiveStatus: "ARCHIVE", request: "Price on request" };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: ru ? "Главная" : sk ? "Domov" : "Home", item: `${SITE_URL}${ru ? "/ru" : sk ? "/sk" : ""}` },
      { "@type": "ListItem", position: 2, name: ru ? "Работы" : sk ? "Diela" : "Works", item: `${SITE_URL}${ru ? "/ru" : sk ? "/sk" : ""}/works` },
    ],
  };
  const filters = [
    { value: "all", label: labels.all },
    { value: "available", label: labels.available },
    { value: "sold", label: labels.sold },
  ] as const;
  return (
    <main className="archive gallery-archive">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="archive-mast">
        <span className="eyebrow">PETIT.SOT / {ru ? "КОЛЛЕКЦИЯ" : sk ? "KOLEKCIA" : "COLLECTION"}</span>
        <h1>{ru ? "Оригинальные картины" : sk ? "Originálne obrazy" : "Original paintings"}</h1>
        <p>{ru ? "Оригинальные картины Ольги Трихлеб в продаже: авторская живопись, пейзажи, морские и городские сюжеты для дома и интерьера. У каждой работы указаны техника, размер, год, стоимость и доступность." : sk ? "Objavte originálne obrazy výtvarníčky Olgy Trikhleb. Prezrite si jedinečné krajiny, morské a mestské scenérie. Pri každom diele nájdete techniku, rozmery, rok a aktuálnu dostupnosť." : "Discover original paintings for sale online by artist Olga Trikhleb. Explore one-of-a-kind landscapes, seascapes and city scenes for contemporary interiors. Each artwork includes its medium, dimensions, year and current availability."}</p>
      </div>
      <nav className="works-filter" aria-label={ru ? "Фильтр работ" : sk ? "Filtrovať diela" : "Filter artworks"} style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "24px 0" }}>
        {filters.map((filter) => (
          <Link key={filter.value} href={filter.value === "all" ? (sk ? "/sk/obrazy" : "/works") : `${sk ? "/sk/obrazy" : "/works"}?status=${filter.value}`} aria-current={status === filter.value ? "page" : undefined} style={{ textDecoration: status === filter.value ? "underline" : "none", textUnderlineOffset: 5 }}>
            {filter.label}
          </Link>
        ))}
        <span style={{ marginLeft: "auto" }}>{visibleWorks.length} / {works.length} {labels.count}</span>
      </nav>
      {visibleWorks.length > 0 ? (
        <div className="archive-grid archive-grid-even">
          {visibleWorks.map((work, index) => {
            const title = ru ? work.titleRu : sk ? work.titleSk : work.titleEn;
            const medium = localizeMedium(work.medium, ru ? "ru" : sk ? "sk" : "en");
            const statusLabel = work.available ? labels.availableStatus : work.sold ? labels.soldStatus : labels.archiveStatus;
            const price = work.price > 0
              ? new Intl.NumberFormat(ru ? "ru-RU" : sk ? "sk-SK" : "en-GB", { style: "currency", currency: work.currency }).format(work.price)
              : labels.request;
            return (
              <Link className="archive-card" href={(sk ? "/sk/obrazy/" : "/works/") + work.slug} key={work.slug}>
                <div className="archive-image art-placeholder">
                  {work.thumbnailUrl
                    ? <img src={work.thumbnailUrl} alt={work.imageAlts[ru ? "ru" : sk ? "sk" : "en"][0]} loading="lazy" decoding="async" />
                    : <><span>{String(index + 1).padStart(2, "0")}</span><small>{ru ? "ИЗОБРАЖЕНИЕ" : sk ? "OBRAZ" : "IMAGE"}</small></>}
                </div>
                <div className="archive-card-meta"><span>{title}</span><span>{work.year}</span></div>
                <p>{medium}</p>
                <span className={`archive-card-status ${work.sold ? "archive-card-sold" : ""}`}>{statusLabel}</span>
                <p className="archive-card-price">{price}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="works-empty">{ru ? "В этой категории пока нет картин." : sk ? "V tejto kategórii zatiaľ nie sú žiadne diela." : "There are no artworks in this category yet."}</p>
      )}
    </main>
  );
}

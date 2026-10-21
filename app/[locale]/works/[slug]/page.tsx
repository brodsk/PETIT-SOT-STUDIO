import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWork, localizeMedium } from "../../../../lib/works";
import Link from "next/link";
import ArtworkViewer from "./ArtworkViewer";

const SITE_URL = "https://www.petitsot.com";
const IMAGE_LICENSE_URL = `${SITE_URL}/image-licensing`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const ru = locale === "ru";
  const w = await getWork(slug);
  if (!w) return {};

  const title = ru ? w.titleRu : w.titleEn;
  const rawMedium = (w.medium || "").toLowerCase();
  const isOil = /oil|масл/.test(rawMedium);
  const isAcrylic = /acrylic|акрил/.test(rawMedium);
  const workTypeEn = isOil ? "Original Oil Painting" : isAcrylic ? "Original Acrylic Painting" : "Original Artwork";
  const workTypeRu = isOil ? "оригинальная картина маслом" : isAcrylic ? "оригинальная акриловая картина" : "оригинальная работа";
  const seoArtworkBySlug: Record<string, { en: { subject: string; description: string }; ru: { subject: string; description: string } }> = {
    "rain-in-the-city": {
      en: { subject: "Rainy City", description: "Discover Rain in the City, an original painting by Olga Trikhleb depicting a rainy urban scene. View the canvas details, dimensions and purchase options." },
      ru: { subject: "дождливый город", description: "Оригинальная картина «Дождь в городе» Ольги Трихлеб с городским пейзажем под дождём. Посмотрите детали, размер и варианты покупки." },
    },
    rain: {
      en: { subject: "Rainy City", description: "Discover Rain in the City, an original painting by Olga Trikhleb depicting a rainy urban scene. View the canvas details, dimensions and purchase options." },
      ru: { subject: "дождливый город", description: "Оригинальная картина «Дождь в городе» Ольги Трихлеб с городским пейзажем под дождём. Посмотрите детали, размер и варианты покупки." },
    },
    meadow: {
      en: { subject: "Landscape with Sheep", description: "Explore Meadow, an original countryside landscape painting with sheep by Olga Trikhleb. See the artwork details, canvas size and purchase options." },
      ru: { subject: "луговой пейзаж с овцами", description: "«Meadow» — оригинальный сельский пейзаж Ольги Трихлеб с овцами. Посмотрите описание картины, размер и варианты покупки." },
    },
    "sunset-in-the-village": {
      en: { subject: "Village Sunset", description: "View Sunset in the Village, an original landscape painting by Olga Trikhleb capturing a sunset over a village. Explore its dimensions and purchase options." },
      ru: { subject: "закат в деревне", description: "«Закат в деревне» — оригинальный пейзаж Ольги Трихлеб с вечерним светом над деревней. Узнайте размер картины и варианты покупки." },
    },
    sunset: {
      en: { subject: "Village Sunset", description: "View Sunset in the Village, an original landscape painting by Olga Trikhleb capturing a sunset over a village. Explore its dimensions and purchase options." },
      ru: { subject: "закат в деревне", description: "«Закат в деревне» — оригинальный пейзаж Ольги Трихлеб с вечерним светом над деревней. Узнайте размер картины и варианты покупки." },
    },
    evening: {
      en: { subject: "Landscape Painting", description: "Discover Evening, an original landscape painting by Olga Trikhleb. View the artwork details, dimensions and available purchase options." },
      ru: { subject: "вечерний пейзаж", description: "«Evening» — оригинальная картина с вечерним пейзажем Ольги Трихлеб. Посмотрите детали работы, размер и варианты покупки." },
    },
    nice: {
      en: { subject: "Seascape", description: "Discover Nice, an original seascape painting by Olga Trikhleb featuring a view of the sea. Explore the artwork details, dimensions and purchase options." },
      ru: { subject: "морской пейзаж", description: "«Nice» — оригинальная картина Ольги Трихлеб с видом на море. Посмотрите детали работы, размер и варианты покупки." },
    },
    angel: {
      en: { subject: "Fallen Angel", description: "Discover Angel, an original painting by Olga Trikhleb depicting a fallen angel. View the artwork details, dimensions and purchase options." },
      ru: { subject: "падший ангел", description: "«Angel» — оригинальная картина Ольги Трихлеб с образом падшего ангела. Посмотрите детали работы, размер и варианты покупки." },
    },
    road: {
      en: { subject: "Landscape Painting", description: "Explore Road, an original landscape painting by Olga Trikhleb. View the composition, canvas dimensions and purchase options." },
      ru: { subject: "пейзаж с дорогой", description: "«Road» — оригинальная картина Ольги Трихлеб с пейзажным мотивом дороги. Посмотрите детали, размер и варианты покупки." },
    },
    fog: {
      en: { subject: "Misty Landscape", description: "Discover Fog, an original landscape painting by Olga Trikhleb depicting a scene in mist. View the artwork details, dimensions and purchase options." },
      ru: { subject: "пейзаж в тумане", description: "«Fog» — оригинальная картина Ольги Трихлеб с пейзажем в тумане. Посмотрите детали работы, размер и варианты покупки." },
    },
  };
  const seoArtwork = seoArtworkBySlug[slug];
  const seoTitle = seoArtwork
    ? ru
      ? `${title} — ${isOil ? "картина маслом: " : ""}${seoArtwork.ru.subject}`
      : `${title} — ${isOil ? "Original Oil Painting" : isAcrylic ? "Original Acrylic Painting" : "Original Artwork"} | ${seoArtwork.en.subject}`
    : ru
      ? `${title} — ${isOil ? "картина маслом" : isAcrylic ? "акриловая картина" : "оригинальная работа"}`
      : `${title} — ${workTypeEn}`;
  const description = seoArtwork
    ? ru
      ? `${seoArtwork.ru.description} Год: ${w.year}; размер: ${w.size}.`
      : `${seoArtwork.en.description} Year: ${w.year}; size: ${w.size}.`
    : ru
      ? `${workTypeRu.charAt(0).toUpperCase() + workTypeRu.slice(1)} «${title}» Ольги Трихлеб, ${w.year}, ${w.size}. Посмотрите детали работы и варианты покупки.`
      : `${workTypeEn} “${title}” by Olga Trikhleb, ${w.year}, ${w.size}. View artwork details and purchase options.`;
  const image = w.imageUrl;
  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/works/${w.slug}`;

  return {
    title: seoTitle,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/works/${w.slug}`,
        ru: `${SITE_URL}/ru/works/${w.slug}`,
        "x-default": `${SITE_URL}/works/${w.slug}`,
      },
    },
    openGraph: {
      type: "website",
      title: `${title} — Olga Trikhleb`,
      description,
      url: canonical,
      siteName: "PETIT.SOT STUDIO",
      locale: ru ? "ru_RU" : "en_GB",
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${title} — Olga Trikhleb`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const ru = locale === "ru";
  const w = await getWork(slug);
  if (!w) notFound();

  const title = ru ? w.titleRu : w.titleEn;
  const description = (ru ? w.descriptionRu : w.descriptionEn) || `${title} — artwork by Olga Trikhleb.`;
  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/works/${w.slug}`;
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
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: canonical,
      },
    ],
  };

  const primaryImage = w.imageUrl || w.images[0];
  const imageLicensing = {
    acquireLicensePage: IMAGE_LICENSE_URL,
    license: IMAGE_LICENSE_URL,
    copyrightNotice: "© Olga Trikhleb",
    creditText: "Olga Trikhleb / PETIT.SOT STUDIO",
  };
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    inLanguage: ru ? "ru" : "en",
    ...(primaryImage
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: primaryImage,
            contentUrl: primaryImage,
            caption: title,
            creator: {
              "@type": "Person",
              name: "Olga Trikhleb",
            },
            ...imageLicensing,
          },
        }
      : {}),
    mainEntity: { "@id": `${canonical}#product` },
  };
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonical}#product`,
    mainEntityOfPage: { "@id": `${canonical}#webpage` },
    name: title,
    description,
    image: w.images.length ? w.images : w.imageUrl ? [w.imageUrl] : [],
    url: canonical,
    inLanguage: ru ? "ru" : "en",
    sku: w.slug,
    brand: {
      "@type": "Brand",
      name: "PETIT.SOT STUDIO",
    },
    creator: {
      "@type": "Person",
      name: "Olga Trikhleb",
      sameAs: ["https://www.instagram.com/petit.sot.art"],
    },
    category: "Contemporary artwork",
    material: localizeMedium(w.medium, ru ? "ru" : "en"),
    ...(primaryImage ? { image: { "@type": "ImageObject", url: primaryImage, contentUrl: primaryImage, caption: title, creator: { "@type": "Person", name: "Olga Trikhleb" }, ...imageLicensing } } : {}),
    offers:
      w.price > 0
        ? {
            "@type": "Offer",
            url: w.etsyListingUrl || w.sasheListingUrl || canonical,
            priceCurrency: w.currency,
            price: w.price,
            availability: w.available
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          }
        : undefined,
  };

  return (
    <main className="work-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Link href="/works" className="back">← {ru ? "Архив" : "Archive"}</Link>
      <ArtworkViewer images={w.images.length ? w.images : w.imageUrl ? [w.imageUrl] : []} alt={`${title} — ${localizeMedium(w.medium, ru ? "ru" : "en")}, ${w.year}${ru ? ", оригинальная картина Ольги Трихлеб" : ", original painting by Olga Trikhleb"}`} slug={w.slug}/>
      <aside className="work-info">
        <p className="eyebrow">PETIT.SOT / {w.year}</p>
        <h1>{title}</h1>
        <dl>
          <div><dt>{ru ? "Материал" : "Medium"}</dt><dd>{localizeMedium(w.medium, ru ? "ru" : "en")}</dd></div>
          <div><dt>{ru ? "Размер" : "Size"}</dt><dd>{w.size}</dd></div>
          <div><dt>{ru ? "Год" : "Year"}</dt><dd>{w.year}</dd></div>
        </dl>
        <Link className="interior-button" href={`/wall-preview?work=${encodeURIComponent(w.slug)}`}>
          <span>{ru ? "Примерить на своей стене" : "Preview on your wall"}</span><span className="interior-button-arrow">↗</span>
        </Link>
        <p className="work-description">{description}</p>
        <div className="purchase-box">{w.available ? <><div><span className="purchase-label">{ru ? "Доступна" : "Available"}</span><strong>{w.price > 0 ? new Intl.NumberFormat(ru ? "ru-RU" : "en-GB", {style:"currency", currency:w.currency}).format(w.price) : (ru ? "Цена по запросу" : "Price on request")}</strong></div>{w.etsyListingUrl ? <a className="purchase-button" href={w.etsyListingUrl} target="_blank" rel="noopener noreferrer">{ru ? "Купить на Etsy" : "Buy on Etsy"} <span>↗</span></a> : <Link className="purchase-button" href={"/contact?work=" + encodeURIComponent(title)}>{ru ? "Приобрести работу" : "Acquire this work"} <span>↗</span></Link>}{w.sasheListingUrl && <a className="purchase-button purchase-button-sashe" href={w.sasheListingUrl} target="_blank" rel="noopener noreferrer">{ru ? "Купить на SAShE" : "Buy on SAShE"} <span>↗</span></a>}<p>{w.etsyListingUrl ? (ru ? "Выберите площадку, чтобы оформить покупку." : "Choose a marketplace to complete your purchase.") : (ru ? "Ссылка на Etsy пока не добавлена. Можно посмотреть работы в магазине SAShE или отправить запрос." : "The Etsy listing link isn’t available yet. You can visit our SAShE shop or send a purchase enquiry.")}</p></> : <><span className="purchase-label">{ru ? "Статус" : "Status"}</span><strong>{ru ? "Продано / недоступно" : "Sold / unavailable"}</strong></>}</div>
      </aside>
    </main>
  );
}

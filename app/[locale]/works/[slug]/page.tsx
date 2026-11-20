import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWork, localizeMedium } from "../../../../lib/works";
import Link from "next/link";
import ArtworkViewer from "./ArtworkViewer";
import PayPalCheckoutButton from "./PayPalCheckoutButton";
import ContactForm from "../../contact/ContactForm";
import FineArtPrintCheckout from "./FineArtPrintCheckout";
import { createClient } from "../../../../lib/supabase/server";

const SITE_URL = "https://www.petitsot.com";
const IMAGE_LICENSE_URL = `${SITE_URL}/image-licensing`;

const purchaseTrustCopy = {
  en: {
    packaging: "Packaging & dispatch — TODO: add confirmed packaging and dispatch details.",
    delivery: "Delivery timeframe — TODO: add verified delivery estimates by destination.",
    authenticity: "Signature & certificate — TODO: confirm signature and certificate arrangements.",
    returns: "Returns & Refunds",
  },
  ru: {
    packaging: "Упаковка и отправка — TODO: добавить подтверждённые условия упаковки и отправки.",
    delivery: "Сроки доставки — TODO: указать проверенные сроки по направлениям.",
    authenticity: "Подпись и сертификат — TODO: подтвердить условия подписи и сертификата подлинности.",
    returns: "Возвраты и возврат средств",
  },
  sk: {
    packaging: "Balenie a odoslanie — TODO: doplniť potvrdené informácie o balení a odoslaní.",
    delivery: "Čas doručenia — TODO: uviesť overené lehoty podľa krajiny.",
    authenticity: "Podpis a certifikát — TODO: potvrdiť podmienky podpisu a certifikátu pravosti.",
    returns: "Vrátenie tovaru a peňazí",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  const trust = purchaseTrustCopy[sk ? "sk" : ru ? "ru" : "en"];
  const w = await getWork(slug);
  if (!w) return {};

  const title = ru ? w.titleRu : sk ? w.titleSk : w.titleEn;
  const rawMedium = (w.medium || "").toLowerCase();
  const isOil = /oil|масл/.test(rawMedium);
  const isAcrylic = /acrylic|акрил/.test(rawMedium);
  const workTypeEn = isOil ? "Original Oil Painting" : isAcrylic ? "Original Acrylic Painting" : "Original Artwork";
  const workTypeRu = isOil ? "оригинальная картина маслом" : isAcrylic ? "оригинальная акриловая картина" : "оригинальная работа";
  const workTypeSk = isOil ? "originálny olejomaľovaný obraz" : isAcrylic ? "originálny akrylový obraz" : "originálne umelecké dielo";
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
  const seoArtwork = seoArtworkBySlug[slug.toLowerCase()];
  const generatedSeoTitle = seoArtwork
    ? ru
      ? `${title} — ${isOil ? "картина маслом: " : ""}${seoArtwork.ru.subject}`
      : sk ? `${title} — ${workTypeSk}` : `${title} — ${isOil ? "Original Oil Painting" : isAcrylic ? "Original Acrylic Painting" : "Original Artwork"} | ${seoArtwork.en.subject}`
    : ru
      ? `${title} — ${isOil ? "картина маслом" : isAcrylic ? "акриловая картина" : "оригинальная работа"}`
      : sk ? `${title} — ${workTypeSk}` : `${title} — ${workTypeEn}`;
  // AI-generated English titles already contain the complete SEO suffix.
  const seoTitle = !ru && !sk && /\|\s*PETIT\.SOT\s*$/i.test(title) ? title : generatedSeoTitle;
  const description = sk
    ? (w.descriptionSk || `${workTypeSk.charAt(0).toUpperCase() + workTypeSk.slice(1)} „${title}“ od Olgy Trikhleb, rok ${w.year}, rozmery ${w.size}. Pozrite si podrobnosti diela a možnosti zakúpenia.`)
    : seoArtwork
      ? ru
        ? `${seoArtwork.ru.description} Год: ${w.year}; размер: ${w.size}.`
        : `${seoArtwork.en.description} Year: ${w.year}; size: ${w.size}.`
      : ru
        ? `${workTypeRu.charAt(0).toUpperCase() + workTypeRu.slice(1)} «${title}» Ольги Трихлеб, ${w.year}, ${w.size}. Посмотрите детали работы и варианты покупки.`
        : `${workTypeEn} “${title}” by Olga Trikhleb, ${w.year}, ${w.size}. A one-of-a-kind artwork for your home or collection.`;
  const image = w.imageUrl;
  const canonical = sk ? `${SITE_URL}/sk/obrazy/${w.slug}` : `${SITE_URL}${ru ? "/ru" : ""}/works/${w.slug}`;

  return {
    title: seoTitle,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/works/${w.slug}`,
        ru: `${SITE_URL}/ru/works/${w.slug}`,
        sk: `${SITE_URL}/sk/obrazy/${w.slug}`,
        "x-default": `${SITE_URL}/works/${w.slug}`,
      },
    },
    openGraph: {
      type: "website",
      title: seoTitle,
      description,
      url: canonical,
      siteName: "PETIT.SOT STUDIO",
      locale: sk ? "sk_SK" : ru ? "ru_RU" : "en_GB",
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
  const sk = locale === "sk";
  const w = await getWork(slug);
  if (!w) notFound();
  const supabase = await createClient();
  const { data: printVariants } = w.id ? await supabase.from("petit_sot_print_variants")
    .select("id,size_label,width_mm,height_mm,retail_price_eur")
    .eq("artwork_id", w.id).eq("active", true).order("sort_order", { ascending: true }) : { data: [] };

  const title = ru ? w.titleRu : sk ? w.titleSk : w.titleEn;
  const displayTitle = title
    .replace(/\s*\|\s*PETIT\.SOT\s*$/i, "")
    .replace(/\s+[—–-]\s+(?:Original (?:Oil|Acrylic) Painting|Original Artwork|картина маслом|акриловая картина|оригинальная работа|originálny olejomaľovaný obraz|originálny akrylový obraz|originálne umelecké dielo).*$/i, "")
    .trim();
  const workTypeSk = /oil|масл/i.test(w.medium || "") ? "Originálna olejomaľba" : /acrylic|акрил/i.test(w.medium || "") ? "Originálna akrylová maľba" : "Originálne umelecké dielo";
  const description = (ru ? w.descriptionRu : sk ? w.descriptionSk : w.descriptionEn) || (sk ? `${workTypeSk} „${title}“ od Olgy Trikhleb. Pozrite si rozmery, techniku a možnosti zakúpenia.` : `${title} — artwork by Olga Trikhleb.`);
  const canonical = sk ? `${SITE_URL}/sk/obrazy/${w.slug}` : `${SITE_URL}${ru ? "/ru" : ""}/works/${w.slug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: ru ? "Главная" : sk ? "Domov" : "Home",
        item: `${SITE_URL}${ru ? "/ru" : ""}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: ru ? "Работы" : sk ? "Diela" : "Works",
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
    inLanguage: sk ? "sk" : ru ? "ru" : "en",
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
  const artworkSchema = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    "@id": `${canonical}#artwork`,
    name: title,
    description,
    url: canonical,
    mainEntityOfPage: { "@id": `${canonical}#webpage` },
    image: primaryImage ? [primaryImage] : [],
    artist: {
      "@type": "Person",
      "@id": `${SITE_URL}/#artist`,
      name: "Olga Trikhleb",
      url: `${SITE_URL}/about`,
      sameAs: ["https://www.instagram.com/petit.sot.art"],
    },
    creator: { "@id": `${SITE_URL}/#artist` },
    artform: "Painting",
    artMedium: localizeMedium(w.medium, sk ? "sk" : ru ? "ru" : "en"),
    ...(w.year && w.year !== "—" ? { dateCreated: w.year } : {}),
    ...(w.widthCm ? { width: { "@type": "QuantitativeValue", value: w.widthCm, unitCode: "CMT", unitText: "cm" } } : {}),
    ...(w.heightCm ? { height: { "@type": "QuantitativeValue", value: w.heightCm, unitCode: "CMT", unitText: "cm" } } : {}),
    ...(w.depthCm ? { depth: { "@type": "QuantitativeValue", value: w.depthCm, unitCode: "CMT", unitText: "cm" } } : {}),
    identifier: w.slug,
    copyrightNotice: "© Olga Trikhleb",
    ...(w.price > 0 ? { offers: { "@type": "Offer", url: canonical, priceCurrency: "EUR", price: w.price, availability: w.available ? "https://schema.org/InStock" : w.sold ? "https://schema.org/SoldOut" : "https://schema.org/OutOfStock" } } : {}),
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
    inLanguage: sk ? "sk" : ru ? "ru" : "en",
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
    material: localizeMedium(w.medium, sk ? "sk" : ru ? "ru" : "en"),
    offers:
      w.price > 0
        ? {
            "@type": "Offer",
            url: w.etsyListingUrl || w.sasheListingUrl || canonical,
            priceCurrency: "EUR",
            price: w.price,
            availability: w.available ? "https://schema.org/InStock" : w.sold ? "https://schema.org/SoldOut" : "https://schema.org/OutOfStock",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(artworkSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Link href="/works" className="back">← {ru ? "Архив" : sk ? "Galéria" : "Archive"}</Link>
      <ArtworkViewer images={w.images.length ? w.images : w.imageUrl ? [w.imageUrl] : []} thumbnailImages={w.thumbnailImages} imageAlts={w.imageAlts[sk ? "sk" : ru ? "ru" : "en"]} alt={`${displayTitle}, ${localizeMedium(w.medium, sk ? "sk" : ru ? "ru" : "en")}, ${w.year}, ${ru ? "автор Ольга Трихлеб" : sk ? "autorka Olga Trikhleb" : "by Olga Trikhleb"}`} slug={w.slug}/>
      <aside className="work-info">
        <p className="eyebrow">PETIT.SOT / {w.year}</p>
        <h1>{displayTitle}</h1>
        <dl>
          <div><dt>{ru ? "Материал" : sk ? "Technika" : "Medium"}</dt><dd>{localizeMedium(w.medium, sk ? "sk" : ru ? "ru" : "en")}</dd></div>
          <div><dt>{ru ? "Размер" : sk ? "Rozmery" : "Size"}</dt><dd>{w.size}</dd></div>
          <div><dt>{ru ? "Год" : sk ? "Rok" : "Year"}</dt><dd>{w.year}</dd></div>
        </dl>
        <Link className="interior-button" href={`/wall-preview/${encodeURIComponent(w.slug)}`}>
          <span>{ru ? "Примерить на своей стене" : sk ? "Vyskúšať obraz na vlastnej stene" : "Preview on your wall"}</span><span className="interior-button-arrow">↗</span>
        </Link>
        <p className="work-description">{description}</p>
        <div className="purchase-box">{w.available ? <><div><span className="purchase-label">{ru ? "Доступна" : sk ? "Dostupné" : "Available"}</span><strong>{w.price > 0 ? new Intl.NumberFormat(ru ? "ru-RU" : sk ? "sk-SK" : "en-GB", {style:"currency", currency:w.currency}).format(w.price) : (ru ? "Цена по запросу" : sk ? "Cena na vyžiadanie" : "Price on request")}</strong></div>{w.price > 0 && <PayPalCheckoutButton slug={w.slug} locale={locale} price={w.price} />}{w.etsyListingUrl ? <a className="purchase-button" href={w.etsyListingUrl} target="_blank" rel="noopener noreferrer">{ru ? "Купить на Etsy" : sk ? "Kúpiť na Etsy" : "Buy on Etsy"} <span>↗</span></a> : <Link className="purchase-button" href={"/contact?work=" + encodeURIComponent(title)}>{ru ? "Приобрести работу" : sk ? "Kúpiť toto dielo" : "Acquire this work"} <span>↗</span></Link>}{w.sasheListingUrl && <a className="purchase-button purchase-button-sashe" href={w.sasheListingUrl} target="_blank" rel="noopener noreferrer">{ru ? "Купить на SAShE" : sk ? "Kúpiť na SAShE" : "Buy on SAShE"} <span>↗</span></a>}<p>{w.etsyListingUrl ? (ru ? "Выберите площадку, чтобы оформить покупку." : sk ? "Vyberte si platformu, na ktorej chcete dokončiť nákup." : "Choose a marketplace to complete your purchase.") : (ru ? "Ссылка на Etsy пока не добавлена. Можно посмотреть работы в магазине SAShE или отправить запрос." : sk ? "Odkaz na Etsy zatiaľ nie je k dispozícii. Dielo si môžete pozrieť v obchode SAShE alebo nám poslať otázku." : "The Etsy listing link isn’t available yet. You can visit our SAShE shop or send a purchase enquiry.")}</p></> : w.sold ? <><div><span className="purchase-label">{ru ? "ПРОДАНА" : sk ? "PREDANÉ" : "SOLD"}</span><strong>{w.price > 0 ? new Intl.NumberFormat(ru ? "ru-RU" : sk ? "sk-SK" : "en-GB", {style:"currency", currency:w.currency}).format(w.price) : (ru ? "Цена по запросу" : sk ? "Cena na vyžiadanie" : "Price on request")}</strong></div></> : <><span className="purchase-label">{ru ? "АРХИВ" : sk ? "ARCHÍV" : "ARCHIVE"}</span><strong>{ru ? "Сейчас не продаётся" : sk ? "Momentálne nie je na predaj" : "Not currently for sale"}</strong><p>{ru ? "Эта работа находится в архиве. Если хотите обсудить похожую картину, оставьте запрос." : sk ? "Toto dielo je súčasťou archívu. Ak máte záujem o podobný obraz, pošlite nám správu." : "This artwork is part of the archive. Contact us to discuss a similar commission."}</p><div className="archive-enquiry"><h2>{ru ? "Заказать похожую работу" : sk ? "Dopyt na podobné dielo" : "Enquire about a similar artwork"}</h2><ContactForm ru={ru} sk={sk} initialMessage={ru ? "Здравствуйте! Хотел(а) бы обсудить похожую работу по мотивам картины «"+title+"»." : sk ? "Dobrý deň, rád/rada by som sa informoval(a) o podobnom diele inšpirovanom obrazom „"+title+"“." : "Hello! I would like to enquire about a similar artwork inspired by “"+title+"”."} /></div></>}</div>
        {w.available && <section className="purchase-trust" aria-label={trust.returns} style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #e8e5e0", fontSize: 12, lineHeight: 1.6 }}>
          <p>{trust.packaging}</p>
          <p>{trust.delivery}</p>
          <p>{trust.authenticity}</p>
          <Link href={locale === "en" ? "/return-policy" : `/${locale}/return-policy`}>{trust.returns} ↗</Link>
        </section>}
        {printVariants && printVariants.length > 0 && <FineArtPrintCheckout variants={printVariants} locale={locale} />}
      </aside>
    </main>
  );
}

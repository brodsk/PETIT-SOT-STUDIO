import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWork, localizeMedium } from "../../../../lib/works";
import { createClient } from "../../../../lib/supabase/server";
import Link from "next/link";
import ArtworkViewer from "./ArtworkViewer";
import InteriorShowcase from "./InteriorShowcase";

const SITE_URL = "https://www.petitsot.com";

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
  const seoTitle = ru
    ? `${title} — ${isOil ? "картина маслом" : isAcrylic ? "акриловая картина" : "оригинальная работа"}`
    : `${title} — ${workTypeEn}`;
  const description = ru
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

  let interiors: { image_url: string; style: string }[] = [];
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    w.id
  ) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("petit_sot_artwork_interiors")
        .select("image_path,style,created_at")
        .eq("artwork_id", w.id)
        .order("created_at", { ascending: false });
      interiors = (data || []).map((item) => ({
        image_url: supabase.storage.from("petit-sot-artworks").getPublicUrl(item.image_path).data.publicUrl,
        style: item.style,
      }));
    } catch {}
  }

  const title = ru ? w.titleRu : w.titleEn;
  const description = (ru ? w.descriptionRu : w.descriptionEn) || `${title} — artwork by Olga Trikhleb.`;
  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/works/${w.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
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
      sameAs: ["https://www.instagram.com/petit.sot/"],
    },
    category: "Contemporary artwork",
    material: localizeMedium(w.medium, ru ? "ru" : "en"),
    offers:
      w.price > 0
        ? {
            "@type": "Offer",
            url: w.etsyListingUrl || canonical,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Link href="/works" className="back">← {ru ? "Архив" : "Archive"}</Link>
      <ArtworkViewer images={w.images.length ? w.images : w.imageUrl ? [w.imageUrl] : []} alt={title + (ru ? " — оригинальная картина Ольги Трихлеб" : " — original painting by Olga Trikhleb")} slug={w.slug}/>
      <aside className="work-info">
        <p className="eyebrow">PETIT.SOT / {w.year}</p>
        <h1>{title}</h1>
        <dl>
          <div><dt>{ru ? "Материал" : "Medium"}</dt><dd>{localizeMedium(w.medium, ru ? "ru" : "en")}</dd></div>
          <div><dt>{ru ? "Размер" : "Size"}</dt><dd>{w.size}</dd></div>
          <div><dt>{ru ? "Год" : "Year"}</dt><dd>{w.year}</dd></div>
        </dl>
        <InteriorShowcase interiors={interiors} ru={ru}/>
        <p className="work-description">{description}</p>
        <div className="purchase-box">{w.available ? <><div><span className="purchase-label">{ru ? "Доступна" : "Available"}</span><strong>{w.price > 0 ? new Intl.NumberFormat(ru ? "ru-RU" : "en-GB", {style:"currency", currency:w.currency}).format(w.price) : (ru ? "Цена по запросу" : "Price on request")}</strong></div>{w.etsyListingUrl ? <a className="purchase-button" href={w.etsyListingUrl} target="_blank" rel="noopener noreferrer">{ru ? "Купить на Etsy" : "Buy on Etsy"} <span>↗</span></a> : <Link className="purchase-button" href={"/contact?work=" + encodeURIComponent(title)}>{ru ? "Приобрести работу" : "Acquire this work"} <span>↗</span></Link>}{w.sasheListingUrl && <a className="purchase-button purchase-button-sashe" href={w.sasheListingUrl} target="_blank" rel="noopener noreferrer">{ru ? "Купить на SAShE" : "Buy on SAShE"} <span>↗</span></a>}<p>{w.etsyListingUrl ? (ru ? "Выберите площадку, чтобы оформить покупку." : "Choose a marketplace to complete your purchase.") : (ru ? "Ссылка на Etsy пока не добавлена. Можно посмотреть работы в магазине SAShE или отправить запрос." : "The Etsy listing link isn’t available yet. You can visit our SAShE shop or send a purchase enquiry.")}</p></> : <><span className="purchase-label">{ru ? "Статус" : "Status"}</span><strong>{ru ? "Продано / недоступно" : "Sold / unavailable"}</strong></>}</div>
      </aside>
    </main>
  );
}

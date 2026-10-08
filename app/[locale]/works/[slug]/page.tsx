import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWork, localizeMedium } from "../../../../lib/works";
import { createClient } from "../../../../lib/supabase/server";
import Link from "next/link";
import ArtworkViewer from "./ArtworkViewer";
import InteriorShowcase from "./InteriorShowcase";

const SITE_URL = "https://petitsot.com";

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
  const description = (ru ? w.descriptionRu : w.descriptionEn) || `${title} — artwork by Olga Trikhleb.`;
  const image = w.imageUrl;
  const canonical = `${SITE_URL}/works/${w.slug}${ru ? "?lang=ru" : ""}`;

  return {
    title,
    description,
    alternates: {
      canonical,
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
  const canonical = `${SITE_URL}/${locale}/works/${w.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description,
    image: w.images.length ? w.images : w.imageUrl ? [w.imageUrl] : [],
    url: canonical,
    sku: w.slug,
    brand: {
      "@type": "Person",
      name: "Olga Trikhleb",
      url: SITE_URL,
      sameAs: ["https://www.instagram.com/petit.sot/"],
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
            url: canonical,
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
      <ArtworkViewer images={w.images.length ? w.images : w.imageUrl ? [w.imageUrl] : []} alt={title}/>
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
        <div className="purchase-box">{w.available ? <><div><span className="purchase-label">{ru ? "Доступна" : "Available"}</span><strong>{w.price > 0 ? new Intl.NumberFormat(ru ? "ru-RU" : "en-GB", {style:"currency", currency:w.currency}).format(w.price) : (ru ? "Цена по запросу" : "Price on request")}</strong></div><Link className="purchase-button" href={"/contact?work=" + encodeURIComponent(title)}>{ru ? "Приобрести работу" : "Acquire this work"} <span>↗</span></Link><p>{ru ? "Безопасная оплата через Stripe появится здесь. Пока отправьте запрос на приобретение." : "Secure online payment via Stripe will be available here. For now, send a purchase enquiry."}</p></> : <><span className="purchase-label">{ru ? "Статус" : "Status"}</span><strong>{ru ? "Продано / недоступно" : "Sold / unavailable"}</strong></>}</div>
      </aside>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getWorks } from "../../../lib/works";
import { createClient } from "../../../lib/supabase/server";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  const title = ru ? "Художественные принты — PETIT.SOT STUDIO" : sk ? "Umelecké reprodukcie — PETIT.SOT STUDIO" : "Fine Art Prints — PETIT.SOT STUDIO";
  const description = ru
    ? "Художественные репродукции картин Ольги Трихлеб на качественной матовой бумаге. Выберите работу и доступный размер."
    : sk ? "Objavte umelecké reprodukcie originálnych obrazov Olgy Trikhleb na kvalitnom matnom papieri. Prezrite si jednotlivé diela a dostupné veľkosti." : "Discover fine art prints of original paintings by Olga Trikhleb, produced on premium matte art paper. Explore each artwork and available print sizes.";
  const canonical = `${SITE_URL}${ru ? "/ru" : sk ? "/sk" : ""}/prints`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { en: `${SITE_URL}/prints`, ru: `${SITE_URL}/ru/prints`, sk: `${SITE_URL}/sk/prints`, "x-default": `${SITE_URL}/prints` },
    },
    openGraph: { type: "website", title, description, url: canonical, siteName: "PETIT.SOT STUDIO", locale: ru ? "ru_RU" : sk ? "sk_SK" : "en_GB" },
  };
}

export default async function PrintsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  const [works, supabase] = await Promise.all([getWorks(), createClient()]);
  const { data: variants } = await supabase
    .from("petit_sot_print_variants")
    .select("id,artwork_id,size_label,width_mm,height_mm,retail_price_eur,sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const workById = new Map(works.filter((work) => work.id).map((work) => [work.id as string, work]));
  const grouped = new Map<string, { work: (typeof works)[number]; variants: NonNullable<typeof variants> }>();
  for (const variant of variants || []) {
    const work = workById.get(variant.artwork_id);
    if (!work) continue;
    const existing = grouped.get(variant.artwork_id);
    if (existing) existing.variants.push(variant);
    else grouped.set(variant.artwork_id, { work, variants: [variant] });
  }
  const products = [...grouped.values()];
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: ru ? "Художественные принты PETIT.SOT" : sk ? "Umelecké reprodukcie PETIT.SOT" : "PETIT.SOT Fine Art Prints",
    description: ru
      ? "Коллекция художественных репродукций картин Ольги Трихлеб."
      : sk ? "Kolekcia umeleckých reprodukcií obrazov Olgy Trikhleb." : "A collection of fine art reproductions of paintings by Olga Trikhleb.",
    url: `${SITE_URL}${ru ? "/ru" : sk ? "/sk" : ""}/prints`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map(({ work }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/works/${work.slug}`,
        name: sk ? work.titleSk : work.titleEn,
      })),
    },
  };

  return (
    <main className="prints-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <header className="prints-intro">
        <p className="eyebrow">PETIT.SOT / {ru ? "КОЛЛЕКЦИЯ ПРИНТОВ" : sk ? "KOLEKCIA REPRODUKCIÍ" : "PRINT COLLECTION"}</p>
        <h1>{ru ? <>Художественные <i>принты</i></> : sk ? <>Umelecké <i>reprodukcie</i></> : <>Fine Art <i>Prints</i></>}</h1>
        <p className="prints-intro-copy">
          {ru
            ? "Избранные работы Ольги Трихлеб в виде художественных репродукций на матовой бумаге. Каждая работа печатается под заказ — без массового тиража и складских остатков."
            : "Vybrané obrazy Olgy Trikhleb ako umelecké reprodukcie na kvalitnom matnom papieri. Každá reprodukcia sa vyrába na objednávku, bez masovej výroby a zbytočných skladových zásob."}
        </p>
      </header>

      {products.length > 0 ? (
        <section className="prints-grid" aria-label={ru ? "Коллекция принтов" : sk ? "Kolekcia umeleckých reprodukcií" : "Fine art print collection"}>
          {products.map(({ work, variants: options }) => {
            const startingPrice = Math.min(...options.map((item) => Number(item.retail_price_eur)));
            const sizes = [...new Set(options.map((item) => item.size_label))];
            return (
              <Link className="prints-card" href={`/works/${work.slug}`} key={work.id}>
                <div className="prints-card-image">
                  {work.thumbnailUrl || work.imageUrl
                    ? <img src={work.thumbnailUrl || work.imageUrl} alt={`${sk ? work.titleSk : work.titleEn} — ${sk ? "umelecká reprodukcia" : "fine art print"} Olgy Trikhleb`} loading="lazy" />
                    : <span>{work.titleEn}</span>}
                </div>
                <div className="prints-card-meta">
                  <div>
                    <h2>{ru ? work.titleRu : sk ? work.titleSk : work.titleEn}</h2>
                    <p>{ru ? "Художественная печать" : sk ? "Umelecká tlač na papieri" : "Fine art paper print"}</p>
                  </div>
                  <span className="prints-card-arrow">↗</span>
                </div>
                <div className="prints-card-bottom">
                  <span>{ru ? `От €${startingPrice.toFixed(2)}` : sk ? `Od €${startingPrice.toFixed(2)}` : `From €${startingPrice.toFixed(2)}`}</span>
                  <span>{ru ? `${sizes.length} ${sizes.length === 1 ? "размер" : "размера"}` : sk ? `${sizes.length} ${sizes.length === 1 ? "formát" : "formáty"}` : `${sizes.length} ${sizes.length === 1 ? "size" : "sizes"}`}</span>
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <section className="prints-empty">
          <span className="eyebrow">{ru ? "КОЛЛЕКЦИЯ ГОТОВИТСЯ" : sk ? "KOLEKCIA SA PRIPRAVUJE" : "THE COLLECTION IS IN PREPARATION"}</span>
          <h2>{ru ? "Скоро здесь появятся художественные принты." : sk ? "Umelecké reprodukcie už čoskoro." : "Fine art prints are coming soon."}</h2>
          <p>
            {ru
              ? "Мы подбираем подходящие форматы и проверяем качество печати, чтобы каждая репродукция точно передавала оригинальную работу."
              : "Vyberáme vhodné formáty a kontrolujeme kvalitu tlače, aby každá reprodukcia verne zachovala charakter originálneho diela."}
          </p>
          <Link className="arrow-link" href="/works">{ru ? "Смотреть оригинальные работы" : sk ? "Pozrieť originálne obrazy" : "Explore original paintings"} <span>↗</span></Link>
        </section>
      )}
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getWorks } from "../../../../lib/works";

const SITE_URL = "https://www.petitsot.com";
const PAGE_URL = SITE_URL + "/sk/obrazy";

function slovakMedium(value: string) {
  const raw = (value || "").toLowerCase();
  const surface = /paper|papier|бумаг/.test(raw) ? "na papieri" : /wood|drevo|дерев/.test(raw) ? "na dreve" : "na plátne";
  if (/oil|масл/.test(raw)) return "Olej " + surface;
  if (/acrylic|акрил/.test(raw)) return "Akryl " + surface;
  if (/watercolou?r|акварел/.test(raw)) return "Akvarel " + surface;
  if (/gouache|гуаш/.test(raw)) return "Gvaš " + surface;
  if (/mixed media|смешан/.test(raw)) return "Kombinovaná technika";
  return value || "Maľba";
}

export async function generateMetadata(): Promise<Metadata> {
  const title = "Originálne obrazy na predaj | PETIT.SOT STUDIO";
  const description = "Prezrite si originálne obrazy maliarky Olgy Trikhleb. Autorská maľba, krajiny a mestské motívy z nezávislého umeleckého štúdia v Trenčíne na Slovensku.";
  return {
    title,
    description,
    alternates: {
      canonical: PAGE_URL,
      languages: {
        sk: PAGE_URL,
        en: SITE_URL + "/works",
        ru: SITE_URL + "/ru/works",
        "x-default": SITE_URL + "/works",
      },
    },
    openGraph: { type: "website", title, description, url: PAGE_URL, siteName: "PETIT.SOT STUDIO", locale: "sk_SK" },
  };
}

export default async function SlovakWorksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: requestedStatus } = await searchParams;
  const status = requestedStatus === "available" || requestedStatus === "sold" ? requestedStatus : "all";
  const works = await getWorks();
  const visibleWorks = works.filter((work) => status === "all" || (status === "available" ? work.available : work.sold));
  const available = visibleWorks.filter((work) => work.available);
  const sold = visibleWorks.filter((work) => work.sold);
  const archive = visibleWorks.filter((work) => !work.available && !work.sold);
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Originálne obrazy Olgy Trikhleb",
    description: "Kolekcia originálnych obrazov a autorskej maľby od Olgy Trikhleb z Trenčína na Slovensku.",
    url: PAGE_URL,
    inLanguage: "sk",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: works.map((work, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: work.titleSk || work.titleEn,
        url: SITE_URL + "/sk/obrazy/" + work.slug,
      })),
    },
  };
  const renderWorks = (items: typeof works) => (
    <div className="archive-grid archive-grid-even">
      {items.map((work) => (
        <Link className="archive-card" href={"/sk/obrazy/" + work.slug} key={work.slug}>
          <div className="archive-image art-placeholder">
            {work.thumbnailUrl || work.imageUrl
              ? <img src={work.thumbnailUrl || work.imageUrl} alt={work.imageAlts.sk[0]} loading="lazy" decoding="async" />
              : <span>{work.titleSk || work.titleEn}</span>}
          </div>
          <div className="archive-card-meta"><span>{work.titleSk || work.titleEn}</span><span>{work.year}</span></div>
          <p>{slovakMedium(work.medium)}</p>
          <span className="archive-card-status">{work.available ? "Dostupný originál" : work.sold ? "Predané" : "Archív"}</span><p>{work.price > 0 ? new Intl.NumberFormat("sk-SK", { style: "currency", currency: work.currency }).format(work.price) : "Cena na vyžiadanie"}</p>
        </Link>
      ))}
    </div>
  );

  return (
    <main className="text-page about-page" lang="sk">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="about-hero">
        <p className="eyebrow">PETIT.SOT STUDIO · TRENČÍN, SLOVENSKO</p>
        <h1>Originálne<br /><i>obrazy.</i></h1>
        <div className="about-lead">
          <span className="about-index">PETIT.SOT / KOLEKCIA</span>
          <p>Objavte originálne obrazy Olgy Trikhleb, nezávislej maliarky pôsobiacej v Trenčíne. Kolekcia predstavuje autorskú maľbu, krajiny, morské motívy a mestské scény. Pri každom diele nájdete informácie o technike, rozmeroch a dostupnosti.</p>
        </div>
      </section>
      <nav aria-label="Filtrovať diela" style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "24px 0" }}>
        {[{ value: "all", label: "Všetky" }, { value: "available", label: "Dostupné" }, { value: "sold", label: "Predané" }].map((filter) => (
          <Link key={filter.value} href={filter.value === "all" ? "/sk/obrazy" : `/sk/obrazy?status=${filter.value}`} aria-current={status === filter.value ? "page" : undefined} style={{ textDecoration: status === filter.value ? "underline" : "none", textUnderlineOffset: 5 }}>{filter.label}</Link>
        ))}
        <span style={{ marginLeft: "auto" }}>{visibleWorks.length} / {works.length} diel</span>
      </nav>
      {available.length > 0 && <section className="works-section"><div className="works-section-heading"><span className="eyebrow">AKTUÁLNA PONUKA</span><h2>Obrazy na predaj</h2><p>Originálne diela, ktoré sú momentálne dostupné na kúpu.</p></div>{renderWorks(available)}</section>}
      {sold.length > 0 && <section className="works-section works-archive-section"><div className="works-section-heading"><span className="eyebrow">PREDANÉ</span><h2>Predané diela</h2></div>{renderWorks(sold)}</section>}
      {archive.length > 0 && <section className="works-section works-archive-section"><div className="works-section-heading"><span className="eyebrow">ARCHÍV</span><h2>Predchádzajúce práce</h2><p>Predané a archivované diela z umeleckej tvorby Olgy Trikhleb.</p></div>{renderWorks(archive)}</section>}
      {visibleWorks.length === 0 && <section className="about-section"><div className="about-section-copy"><h2>Kolekcia sa pripravuje.</h2><p>Nové originálne obrazy budú v katalógu postupne dopĺňané.</p></div></section>}
      <section className="about-originals">
        <p className="eyebrow">OLGA TRIKHLEB · MALIARKA Z TRENČÍNA</p>
        <p className="about-originals-statement">Originálna maľba. Jedinečné diela. PETIT.SOT STUDIO.</p>
        <div className="about-originals-bottom">
          <span>Trenčín · Slovensko</span>
          <Link className="arrow-link" href="/sk/trencin-art-studio">O štúdiu <span>↗</span></Link>
          <Link className="arrow-link" href="/commission">Maľba na objednávku <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getWorks, localizeMedium } from "../../lib/works";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  const title = ru
    ? "Художница из Тренчина — Ольга Трихлеб | PETIT.SOT STUDIO"
    : sk
      ? "Originálne obrazy a súčasné umenie — Olga Trikhleb | PETIT.SOT STUDIO"
      : "Original Paintings for Sale Online & Contemporary Art";
  const description = ru
    ? "Ольга Трихлеб — художница из Тренчина, Словакия. PETIT.SOT STUDIO представляет оригинальную живопись, современные картины и независимое художественное творчество в городе — Европейской культурной столице 2026 года."
    : sk
      ? "Objavte originálne obrazy súčasnej výtvarníčky Olgy Trikhleb. Prezrite si krajinky, morské a mestské motívy, vyberte si jedinečné umelecké dielo alebo sa informujte o maľbe na objednávku. PETIT.SOT STUDIO sídli v Trenčíne na Slovensku."
      : "Discover one-of-a-kind original paintings by contemporary artist Olga Trikhleb. Explore original landscape, seascape and city paintings for your home, collect unique artwork online or enquire about a custom painting commission. Based in Slovakia, presented to art lovers worldwide.";

  const canonical = sk ? `${SITE_URL}/sk` : ru ? `${SITE_URL}/ru` : SITE_URL;
  const works = await getWorks();
  const previewImage = works.find((work) => work.imageUrl)?.imageUrl;
  const previewAlt = ru
    ? "Оригинальная картина Ольги Трихлеб — PETIT.SOT STUDIO"
    : sk
      ? "Originálny obraz Olgy Trikhleb — PETIT.SOT STUDIO"
      : "Original painting by Olga Trikhleb — PETIT.SOT STUDIO";

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: SITE_URL,
        ru: `${SITE_URL}/ru`,
        sk: `${SITE_URL}/sk`,
        "x-default": SITE_URL,
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

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  const works = await getWorks();
  const primaryWork = works.find((work) => work.imageUrl);
  const primaryImage = primaryWork?.imageUrl;
  const primaryImageAlt = primaryWork
    ? `${ru ? primaryWork.titleRu : sk ? primaryWork.titleSk : primaryWork.titleEn} — ${ru ? "оригинальная картина Ольги Трихлеб" : sk ? "originálny obraz Olgy Trikhleb" : "original painting by Olga Trikhleb"}`
    : (ru ? "Оригинальная картина Ольги Трихлеб" : sk ? "Originálny obraz Olgy Trikhleb" : "Original painting by Olga Trikhleb");
  const pageUrl = `${SITE_URL}${ru ? "/ru" : sk ? "/sk" : ""}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: ru ? "PETIT.SOT STUDIO — художественная студия в Тренчине" : sk ? "PETIT.SOT STUDIO — originálne obrazy Olgy Trikhleb" : "PETIT.SOT STUDIO — Original Paintings by Olga Trikhleb",
        inLanguage: ru ? "ru" : sk ? "sk" : "en",
        ...(primaryImage
          ? {
              primaryImageOfPage: {
                "@type": "ImageObject",
                url: primaryImage,
                contentUrl: primaryImage,
                caption: primaryImageAlt,
                creator: {
                  "@type": "Person",
                  name: "Olga Trikhleb",
                },
              },
            }
          : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "PETIT.SOT STUDIO",
        publisher: { "@id": `${SITE_URL}/#studio` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#studio`,
        name: "PETIT.SOT STUDIO",
        url: SITE_URL,
        description: ru
          ? "Независимая художественная студия Ольги Трихлеб, базирующаяся в Тренчине, Словакия."
          : sk
            ? "Nezávislé umelecké štúdio výtvarníčky Olgy Trikhleb so sídlom v Trenčíne na Slovensku."
            : "An independent art studio by artist Olga Trikhleb, based in Trenčín, Slovakia.",
        location: { "@type": "Place", name: "Trenčín, Slovakia" },
        areaServed: ["Slovakia", "Worldwide"],
        sameAs: ["https://www.instagram.com/petit.sot.art", "https://petitsot.etsy.com", "https://www.sashe.sk/petitsot"],
        founder: { "@id": `${SITE_URL}/#artist` },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#artist`,
        name: "Olga Trikhleb",
        url: `${SITE_URL}/about`,
        jobTitle: ru ? "Художница" : sk ? "Výtvarníčka" : "Visual artist",
        worksFor: { "@id": `${SITE_URL}/#studio` },
        sameAs: ["https://www.instagram.com/petit.sot.art"],
        homeLocation: { "@type": "City", name: "Trenčín", containedInPlace: { "@type": "Country", name: "Slovakia" } },
        knowsAbout: ["Painting", "Contemporary art", "Acrylic painting", "Landscape painting"],
      },
    ],
  };

  return (
    <main className="gallery-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="hero-gallery">
        <div className="hero-top"><span>OLGA TRIKHLEB</span><span className="hero-artist">{ru ? "Художница" : sk ? "Výtvarníčka" : "Artist"} / {new Date().getFullYear()}</span></div>
        <div className="hero-title-wrap">
          <h1 className="hero-wordmark">PETIT.SOT <span className="wordmark-divider">|</span> <span>STUDIO</span></h1>
          <span className="hero-orbit hero-orbit-a"></span><span className="hero-orbit hero-orbit-b"></span>
        </div>
        <div className="hero-bottom"><p>{ru ? "Независимая художественная студия в Тренчине, Словакия. Оригинальная живопись Ольги Трихлеб." : sk ? "Nezávislé umelecké štúdio v Trenčíne na Slovensku. Originálne obrazy Olgy Trikhleb." : "An independent art studio in Trenčín, Slovakia. Original paintings by Olga Trikhleb."}</p><Link className="arrow-link" href={sk ? "/sk/obrazy" : "/works"}>{ru ? "Смотреть работы" : sk ? "Pozrieť diela" : "View works"} <span>↗</span></Link></div>
      </section>

      <section className="gallery-tiles gallery-tiles-all">
        <div className="gallery-tiles-head"><span>{ru ? "Работы" : sk ? "Diela" : "Works"}</span><span>{String(works.length).padStart(2, "0")} {ru ? "работ" : sk ? "diel" : "works"}</span></div>
        <div className="gallery-tiles-grid">
          {works.map((w, i) => <Link href={(sk ? "/sk/obrazy/" : "/works/") + w.slug} className="gallery-tile" key={w.slug}>
            <div className="art-placeholder">{w.thumbnailUrl ? <img src={w.thumbnailUrl} alt={(ru ? w.titleRu : sk ? w.titleSk : w.titleEn) + " — " + localizeMedium(w.medium, ru ? "ru" : sk ? "sk" : "en") + ", " + w.year + (ru ? ", оригинальная картина Ольги Трихлеб" : sk ? ", originálny obraz Olgy Trikhleb" : ", original painting by Olga Trikhleb")} loading={i < 4 ? "eager" : "lazy"} decoding="async" /> : <><span>{String(i + 1).padStart(2, "0")}</span><small>{ru ? "ИЗОБРАЖЕНИЕ" : sk ? "OBRAZ" : "IMAGE"} / {w.year}</small></>}</div>
            <div className="work-meta"><span>{ru ? w.titleRu : sk ? w.titleSk : w.titleEn}</span><span>{w.year}</span></div>
            <div className="work-meta">
              <span>{w.available ? (ru ? "В ПРОДАЖЕ" : sk ? "DOSTUPNÉ" : "AVAILABLE") : w.sold ? (ru ? "ПРОДАНА" : sk ? "PREDANÉ" : "SOLD") : (ru ? "АРХИВ" : sk ? "ARCHÍV" : "ARCHIVE")}</span>
              <span>{w.price > 0 ? new Intl.NumberFormat(ru ? "ru-RU" : sk ? "sk-SK" : "en-GB", { style: "currency", currency: w.currency }).format(w.price) : (ru ? "Цена по запросу" : sk ? "Cena na vyžiadanie" : "Price on request")}</span>
            </div>
          </Link>)}
        </div>
      </section>

      <section className="gallery-statement"><span>{ru ? "ЗАМЕТКА СТУДИИ" : sk ? "POZNÁMKA ŠTÚDIA" : "STUDIO NOTE"}</span><p>{ru ? "Каждая работа — отдельный объект. Архив растёт постепенно." : sk ? "Každé dielo je samostatným originálom. Kolekcia sa postupne rozrastá." : "Each work exists as an independent object. The archive grows slowly."}</p><Link className="arrow-link" href="/about">{ru ? "О студии" : sk ? "O štúdiu" : "About the studio"} <span>↗</span></Link><Link className="arrow-link" href={sk ? "/sk/malba-na-objednavku" : "/commission"}>{ru ? "Заказать картину" : sk ? "Objednať obraz" : "Commission a painting"} <span>↗</span></Link></section>
    </main>
  );
}

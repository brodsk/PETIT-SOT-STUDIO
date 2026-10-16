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
  const title = ru
    ? "Оригинальные картины Ольги Трихлеб"
    : "Original Paintings by Olga Trikhleb";
  const description = ru
    ? "Оригинальные картины Ольги Трихлеб: городские сцены, пейзажи и повседневные сюжеты. Изучите работы и варианты покупки."
    : "Discover original paintings by contemporary artist Olga Trikhleb, from city scenes to landscapes. Explore each work and purchase options.";

  const canonical = ru ? `${SITE_URL}/ru` : SITE_URL;
  const works = await getWorks();
  const previewImage = works.find((work) => work.imageUrl)?.imageUrl;
  const previewAlt = ru
    ? "Оригинальная картина Ольги Трихлеб — PETIT.SOT STUDIO"
    : "Original painting by Olga Trikhleb — PETIT.SOT STUDIO";

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: SITE_URL,
        ru: `${SITE_URL}/ru`,
        "x-default": SITE_URL,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "PETIT.SOT STUDIO",
      locale: ru ? "ru_RU" : "en_GB",
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
  const works = await getWorks();
  const primaryWork = works.find((work) => work.imageUrl);
  const primaryImage = primaryWork?.imageUrl;
  const primaryImageAlt = primaryWork
    ? `${ru ? primaryWork.titleRu : primaryWork.titleEn} — ${ru ? "оригинальная картина Ольги Трихлеб" : "original painting by Olga Trikhleb"}`
    : (ru ? "Оригинальная картина Ольги Трихлеб" : "Original painting by Olga Trikhleb");
  const pageUrl = `${SITE_URL}${ru ? "/ru" : ""}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: ru ? "Оригинальные картины Ольги Трихлеб" : "Original Paintings by Olga Trikhleb",
        inLanguage: ru ? "ru" : "en",
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
        url: `${SITE_URL}${ru ? "/ru" : ""}`,
        name: "PETIT.SOT STUDIO",
        inLanguage: ru ? "ru" : "en",
        publisher: { "@id": `${SITE_URL}/#artist` },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#artist`,
        name: "Olga Trikhleb",
        url: `${SITE_URL}/about`,
        jobTitle: ru ? "Художница" : "Visual artist",
        sameAs: ["https://www.instagram.com/petit.sot.art"],
        knowsAbout: ["Painting", "Contemporary art"],
      },
    ],
  };

  return (
    <main className="gallery-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="hero-gallery">
        <div className="hero-top"><span>OLGA TRIKHLEB</span><span className="hero-artist">{ru ? "Художница" : "Artist"} / {new Date().getFullYear()}</span></div>
        <div className="hero-title-wrap">
          <div className="hero-wordmark">PETIT.SOT <span className="wordmark-divider">|</span> <span>STUDIO</span></div>
          <span className="hero-orbit hero-orbit-a"></span><span className="hero-orbit hero-orbit-b"></span>
        </div>
        <div className="hero-bottom"><p>{ru ? "Оригинальные картины Ольги Трихлеб: городские сцены и пейзажи." : "Original paintings by Olga Trikhleb — city scenes and landscapes."}</p><Link className="arrow-link" href="/works">{ru ? "Смотреть работы" : "View works"} <span>↗</span></Link></div>
      </section>

      <section className="gallery-tiles gallery-tiles-all">
        <div className="gallery-tiles-head"><span>{ru ? "Работы" : "Works"}</span><span>{String(works.length).padStart(2, "0")} {ru ? "работ" : "works"}</span></div>
        <div className="gallery-tiles-grid">
          {works.map((w, i) => <Link href={"/works/" + w.slug} className="gallery-tile" key={w.slug}>
            <div className="art-placeholder">{w.imageUrl ? <img src={w.imageUrl} alt={(ru ? w.titleRu : w.titleEn) + " — " + localizeMedium(w.medium, ru ? "ru" : "en") + ", " + w.year + (ru ? ", оригинальная картина Ольги Трихлеб" : ", original painting by Olga Trikhleb")} loading={i < 4 ? "eager" : "lazy"} decoding="async" /> : <><span>{String(i + 1).padStart(2, "0")}</span><small>{ru ? "ИЗОБРАЖЕНИЕ" : "IMAGE"} / {w.year}</small></>}</div>
            <div className="work-meta"><span>{ru ? w.titleRu : w.titleEn}</span><span>{w.year}</span></div>
          </Link>)}
        </div>
      </section>

      <section className="gallery-statement"><span>02—04</span><p>{ru ? "Каждая работа — отдельный объект. Архив растёт постепенно." : "Each work exists as an independent object. The archive grows slowly."}</p><Link className="arrow-link" href="/about">{ru ? "О студии" : "About the studio"} <span>↗</span></Link></section>
    </main>
  );
}

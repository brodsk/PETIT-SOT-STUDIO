import type { Metadata } from "next";
import Link from "next/link";
import { getWorks } from "../../lib/works";

const SITE_URL = "https://petitsot.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru
    ? "Ольга Трихлеб — художница | PETIT.SOT STUDIO"
    : "Olga Trikhleb — Contemporary Artist | PETIT.SOT STUDIO";
  const description = ru
    ? "Официальный сайт Ольги Трихлеб. Живопись, визуальные исследования и доступные работы."
    : "Official portfolio of Olga Trikhleb. Contemporary paintings, visual research and available works.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        ru: `${SITE_URL}/ru`,
        "x-default": `${SITE_URL}/en`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: "PETIT.SOT STUDIO",
      locale: ru ? "ru_RU" : "en_GB",
    },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  const works = await getWorks();

  return (
    <main className="gallery-home">
      <section className="hero-gallery">
        <div className="hero-top"><span>OLGA TRIKHLEB</span><span className="hero-artist">{ru ? "Художница" : "Artist"} / {new Date().getFullYear()}</span></div>
        <div className="hero-title-wrap">
          <div className="hero-wordmark">PETIT.SOT <span className="wordmark-divider">|</span> <span>STUDIO</span></div>
          <span className="hero-orbit hero-orbit-a"></span><span className="hero-orbit hero-orbit-b"></span>
        </div>
        <div className="hero-bottom"><p>{ru ? "Живопись, исследования и визуальные фрагменты." : "Painting, studies and visual fragments."}</p><Link className="arrow-link" href={"/" + locale + "/works"}>{ru ? "Смотреть работы" : "View works"} <span>↗</span></Link></div>
      </section>

      <section className="gallery-tiles gallery-tiles-all">
        <div className="gallery-tiles-head"><span>{ru ? "Работы" : "Works"}</span><span>{String(works.length).padStart(2, "0")} {ru ? "работ" : "works"}</span></div>
        <div className="gallery-tiles-grid">
          {works.map((w, i) => <Link href={"/" + locale + "/works/" + w.slug} className="gallery-tile" key={w.slug}>
            <div className="art-placeholder">{w.imageUrl ? <img src={w.imageUrl} alt={ru ? w.titleRu : w.titleEn} loading={i < 4 ? "eager" : "lazy"} decoding="async" /> : <><span>{String(i + 1).padStart(2, "0")}</span><small>{ru ? "ИЗОБРАЖЕНИЕ" : "IMAGE"} / {w.year}</small></>}</div>
            <div className="work-meta"><span>{ru ? w.titleRu : w.titleEn}</span><span>{w.year}</span></div>
          </Link>)}
        </div>
      </section>

      <section className="gallery-statement"><span>02—04</span><p>{ru ? "Каждая работа — отдельный объект. Архив растёт постепенно." : "Each work exists as an independent object. The archive grows slowly."}</p><Link className="arrow-link" href={"/" + locale + "/about"}>{ru ? "О студии" : "About the studio"} <span>↗</span></Link></section>
    </main>
  );
}

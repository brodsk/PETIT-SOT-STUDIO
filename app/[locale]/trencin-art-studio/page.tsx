import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale === "ru") redirect("/ru/about");
  const ru = locale === "ru";
  const title = ru
    ? "Художники Тренчина — Ольга Трихлеб | PETIT.SOT STUDIO"
    : "Artists in Trenčín & Local Art — Olga Trikhleb | PETIT.SOT";
  const description = ru
    ? "Ищете художников Тренчина? Познакомьтесь с Ольгой Трихлеб — независимой художницей из Тренчина. Оригинальная живопись, современные картины и PETIT.SOT STUDIO."
    : "Looking for artists in Trenčín? Discover Olga Trikhleb, an independent local visual artist, and explore original paintings and contemporary art at PETIT.SOT STUDIO.";
  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/trencin-art-studio`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/trencin-art-studio`,
        ru: `${SITE_URL}/ru/trencin-art-studio`,
        "x-default": `${SITE_URL}/trencin-art-studio`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "PETIT.SOT STUDIO",
      locale: ru ? "ru_RU" : "en_GB",
    },
  };
}

export default async function TrencinArtStudio({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale === "ru") redirect("/ru/about");
  const ru = locale === "ru";
  const pageUrl = `${SITE_URL}${ru ? "/ru" : ""}/trencin-art-studio`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${pageUrl}#about`,
    url: pageUrl,
    name: ru
      ? "PETIT.SOT STUDIO — художественная студия в Тренчине"
      : "PETIT.SOT STUDIO — Independent Art Studio in Trenčín",
    inLanguage: ru ? "ru" : "en",
    about: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#studio`,
      name: "PETIT.SOT STUDIO",
      url: SITE_URL,
      location: {
        "@type": "Place",
        name: "Trenčín, Slovakia",
      },
    },
    mainEntity: {
      "@type": "Person",
      "@id": `${SITE_URL}/#artist`,
      name: "Olga Trikhleb",
      url: `${SITE_URL}/about`,
      jobTitle: "Visual artist",
      homeLocation: { "@type": "City", name: "Trenčín", containedInPlace: { "@type": "Country", name: "Slovakia" } },
      worksFor: { "@id": `${SITE_URL}/#studio` },
      sameAs: ["https://www.instagram.com/petit.sot.art"],
      knowsAbout: ["Painting", "Contemporary art", "Acrylic painting", "Landscape painting"],
    },
    mentions: {
      "@type": "Thing",
      name: "European Capital of Culture 2026",
      sameAs: "https://www.trencin2026.eu/en/home/",
    },
  };

  return (
    <main className="text-page about-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="about-hero">
        <p className="eyebrow">{ru ? "PETIT.SOT STUDIO · Тренчин, Словакия" : "PETIT.SOT STUDIO · Trenčín, Slovakia"}</p>
        <h1>{ru ? <>Искусство<br /><i>из Тренчина.</i></> : <>Art from<br /><i>Trenčín.</i></>}</h1>
        <div className="about-lead">
          <span className="about-index">PETIT.SOT / TRENCIN</span>
          <p>{ru
            ? "Независимая художественная студия Ольги Трихлеб, базирующаяся в Тренчине, Словакия. Оригинальная живопись, вдохновлённая атмосферой мест, цветом и повседневной жизнью."
            : "An independent art studio by visual artist Olga Trikhleb, based in Trenčín, Slovakia. Original paintings shaped by atmosphere, place, colour and everyday life."}</p>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>01</span><span>{ru ? "Студия" : "The studio"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "Независимая художественная практика." : "An independent artistic practice."}</h2>
          <p>{ru
            ? "PETIT.SOT STUDIO представляет авторскую живопись Ольги Трихлеб. Студия базируется в Тренчине и развивает собственную художественную практику, объединяя оригинальные картины, визуальные исследования и участие в выставочных проектах."
            : "PETIT.SOT STUDIO presents the original paintings of Olga Trikhleb. Based in Trenčín, the studio is an independent creative practice bringing together original artwork, visual exploration and participation in exhibition projects."}</p>
          <p>{ru
            ? "В каталоге представлены оригинальные работы — городские сцены, пейзажи и фрагменты повседневной жизни. Каждая картина создаётся как самостоятельное произведение."
            : "The collection includes original paintings of city scenes, landscapes and fragments of everyday life. Each painting is created as an individual artwork."}</p>
          <p>{ru
            ? "Ольга Трихлеб — независимая художница, работающая в Тренчине. Её практика связывает местный культурный контекст с авторской живописью и современным визуальным искусством."
            : "Olga Trikhleb is an independent artist based in Trenčín. Her practice connects the local cultural context with original painting and contemporary visual art."}</p>
          <Link className="arrow-link" href="/about">{ru ? "Познакомиться с художницей" : "Meet the artist"} <span>↗</span></Link>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>02</span><span>{ru ? "Тренчин 2026" : "Trenčín 2026"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "Город в центре европейской культуры." : "A city at the heart of European culture."}</h2>
          <p>{ru
            ? "В 2026 году Тренчин, Словакия, носит титул Европейской культурной столицы (European Capital of Culture 2026; по-словацки — «Európske hlavné mesto kultúry 2026») вместе с городом Оулу в Финляндии. Годовая культурная программа подчёркивает роль искусства, творчества и местных сообществ."
            : "In 2026, Trenčín, Slovakia, holds the European Capital of Culture title — locally known as “Európske hlavné mesto kultúry 2026” — alongside Oulu in Finland. The year-long programme highlights the role of art, creativity and local communities."}</p>
          <p>{ru
            ? "Для PETIT.SOT STUDIO это важный культурный контекст города, в котором находится студия. PETIT.SOT — независимый художественный проект и не заявляет об официальном партнёрстве или аффилиации с программой Trenčín 2026."
            : "For PETIT.SOT STUDIO, this is the cultural context of the city where the studio is based. PETIT.SOT is an independent art project and does not claim official partnership or affiliation with the Trenčín 2026 programme."}</p>
          <a className="arrow-link" href="https://www.trencin2026.eu/en/home/" target="_blank" rel="noreferrer">
            {ru ? "Официальный сайт Trenčín 2026" : "Official Trenčín 2026 website"} <span>↗</span>
          </a>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>03</span><span>{ru ? "Коллекция" : "The collection"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "Оригинальные картины Ольги Трихлеб." : "Original paintings by Olga Trikhleb."}</h2>
          <p>{ru
            ? "Откройте каталог PETIT.SOT STUDIO и познакомьтесь с доступными оригинальными работами, их историей, размерами и материалами."
            : "Explore the PETIT.SOT STUDIO collection and discover available original works, with details about each painting, its dimensions and medium."}</p>
          <Link className="arrow-link" href="/works">{ru ? "Смотреть каталог картин" : "Explore the paintings"} <span>↗</span></Link>
        </div>
      </section>

      <section className="about-originals">
        <p className="eyebrow">{ru ? "PETIT.SOT STUDIO · Тренчин, Словакия" : "PETIT.SOT STUDIO · Trenčín, Slovakia"}</p>
        <p className="about-originals-statement">{ru
          ? "Независимое искусство. Оригинальная живопись. Европейский культурный контекст."
          : "Independent art. Original paintings. A European cultural context."}</p>
        <div className="about-originals-bottom">
          <span>{ru ? "Ольга Трихлеб · Художница" : "Olga Trikhleb · Visual artist"}</span>
          <Link className="arrow-link" href="/contact">{ru ? "Связаться со студией" : "Contact the studio"} <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}

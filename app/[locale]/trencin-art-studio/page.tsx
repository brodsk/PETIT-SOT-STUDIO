import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale === "ru") redirect("/ru/about");
  const title = "Artist in Trenčín, Slovakia | Original Paintings — PETIT.SOT";
  const description = "Discover original paintings by Olga Trikhleb, an independent artist based in Trenčín, Slovakia. Browse available landscape and city artworks or enquire about a painting commission.";
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/trencin-art-studio`,
      languages: {
        en: `${SITE_URL}/trencin-art-studio`,
        sk: `${SITE_URL}/sk/trencin-art-studio`,
        "x-default": `${SITE_URL}/trencin-art-studio`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/trencin-art-studio`,
      siteName: "PETIT.SOT STUDIO",
      locale: "en_GB",
    },
  };
}

export default async function TrencinArtStudio({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale === "ru") redirect("/ru/about");
  const pageUrl = `${SITE_URL}/trencin-art-studio`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${pageUrl}#about`,
    url: pageUrl,
    name: "Artist in Trenčín, Slovakia — Olga Trikhleb | PETIT.SOT STUDIO",
    inLanguage: "en",
    about: { "@id": `${SITE_URL}/#studio` },
    mainEntity: {
      "@type": "Person",
      "@id": `${SITE_URL}/#artist`,
      name: "Olga Trikhleb",
      url: `${SITE_URL}/about`,
      jobTitle: "Visual artist",
      homeLocation: { "@type": "City", name: "Trenčín", containedInPlace: { "@type": "Country", name: "Slovakia" } },
      worksFor: { "@id": `${SITE_URL}/#studio` },
      sameAs: ["https://www.instagram.com/petit.sot.art"],
      knowsAbout: ["Original painting", "Landscape painting", "Cityscape painting", "Contemporary art"],
    },
  };

  return (
    <main className="text-page about-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="about-hero">
        <p className="eyebrow">PETIT.SOT STUDIO · TRENČÍN, SLOVAKIA</p>
        <h1>Original art<br /><i>from Trenčín.</i></h1>
        <div className="about-lead">
          <span className="about-index">PETIT.SOT / TRENCIN</span>
          <p>PETIT.SOT STUDIO presents original paintings by Olga Trikhleb, an independent visual artist based in Trenčín, Slovakia. Explore one-of-a-kind works shaped by atmosphere, colour, landscapes and everyday places.</p>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>01</span><span>The artist</span></div>
        <div className="about-section-copy">
          <h2>An independent artist based in Trenčín.</h2>
          <p>Olga Trikhleb develops an independent painting practice through PETIT.SOT STUDIO. Her work moves between landscapes, seascapes, city scenes and quiet fragments of everyday life, with attention to colour, composition and atmosphere.</p>
          <p>The studio is based in Trenčín and presents its collection online. It is an independent art project, not a public walk-in gallery with regular visiting hours.</p>
          <Link className="arrow-link" href="/about">Read about the artist <span>↗</span></Link>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>02</span><span>Original paintings</span></div>
        <div className="about-section-copy">
          <h2>Original paintings available to discover and collect.</h2>
          <p>Browse the collection to see current availability, dimensions, medium and details for each original artwork. Every listed work is presented individually, with its own images and description.</p>
          <Link className="arrow-link" href="/works">Explore available paintings <span>↗</span></Link>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>03</span><span>Commission a painting</span></div>
        <div className="about-section-copy">
          <h2>A painting created around your idea.</h2>
          <p>You can enquire about commissioning an original painting. Share the subject, preferred dimensions and any visual references; the studio will discuss the creative direction, timing and proposal with you before work begins.</p>
          <Link className="arrow-link" href="/commission">Enquire about a commission <span>↗</span></Link>
        </div>
      </section>

      <section className="about-originals">
        <p className="eyebrow">PETIT.SOT STUDIO · ORIGINAL PAINTINGS</p>
        <p className="about-originals-statement">Independent art. Original paintings. Based in Trenčín, Slovakia.</p>
        <div className="about-originals-bottom">
          <span>Olga Trikhleb · Visual artist</span>
          <Link className="arrow-link" href="/contact">Contact the studio <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}

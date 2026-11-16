import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWork, localizeMedium } from "../../../../../../lib/works";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) return {};
  const title = work.titleEn + " — originálny obraz od Olgy Trikhleb | PETIT.SOT";
  const availability = work.available ? "Dostupný originálny obraz." : work.sold ? "Originálny obraz bol predaný." : "Dielo je súčasťou archívu.";
  const description = availability + " " + work.titleEn + " od maliarky Olgy Trikhleb z Trenčína. " + localizeMedium(work.medium, "en") + ", " + work.size + ", " + work.year + ". Pozrite si fotografie a informácie o diele.";
  const canonical = SITE_URL + "/sk/obrazy/" + work.slug;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        sk: canonical,
        en: SITE_URL + "/works/" + work.slug,
        ru: SITE_URL + "/ru/works/" + work.slug,
        "x-default": SITE_URL + "/works/" + work.slug,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "PETIT.SOT STUDIO",
      locale: "sk_SK",
      ...(work.imageUrl ? { images: [{ url: work.imageUrl, alt: work.titleEn + " — originálny obraz od Olgy Trikhleb" }] } : {}),
    },
  };
}

export default async function SlovakArtworkPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) notFound();
  const canonical = SITE_URL + "/sk/obrazy/" + work.slug;
  const medium = localizeMedium(work.medium, "en");
  const availability = work.available ? "Dostupný originálny obraz" : work.sold ? "Predané" : "Dielo v archíve";
  const description = work.titleEn + " je originálne výtvarné dielo maliarky Olgy Trikhleb, ktorá pôsobí v Trenčíne na Slovensku. Ide o samostatnú autorskú prácu; technika: " + medium + "; rozmery: " + work.size + "; rok: " + work.year + ".";
  const artworkSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical + "#webpage",
        url: canonical,
        name: work.titleEn + " — originálny obraz Olgy Trikhleb",
        description,
        inLanguage: "sk",
        about: { "@id": canonical + "#artwork" },
      },
      {
        "@type": "VisualArtwork",
        "@id": canonical + "#artwork",
        name: work.titleEn,
        description,
        image: work.images.length ? work.images : work.imageUrl ? [work.imageUrl] : [],
        url: canonical,
        artform: "Maľba",
        artMedium: medium,
        creator: { "@id": SITE_URL + "/#artist" },
        artist: { "@type": "Person", "@id": SITE_URL + "/#artist", name: "Olga Trikhleb", url: SITE_URL + "/about" },
        ...(work.year && work.year !== "—" ? { dateCreated: work.year } : {}),
        ...(work.widthCm ? { width: { "@type": "QuantitativeValue", value: work.widthCm, unitCode: "CMT" } } : {}),
        ...(work.heightCm ? { height: { "@type": "QuantitativeValue", value: work.heightCm, unitCode: "CMT" } } : {}),
      },
    ],
  };

  return (
    <main className="text-page about-page" lang="sk">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(artworkSchema) }} />
      <section className="about-hero">
        <p className="eyebrow">PETIT.SOT STUDIO · OLGA TRIKHLEB</p>
        <h1>{work.titleEn}<br /><i>Originálny obraz.</i></h1>
        <div className="about-lead">
          <span className="about-index">PETIT.SOT / {work.year}</span>
          <p>{description}</p>
        </div>
      </section>
      {work.imageUrl && <section className="about-portrait"><div className="about-portrait-image"><img src={work.imageUrl} alt={work.titleEn + " — originálny obraz od Olgy Trikhleb"} loading="eager" /></div><div className="about-portrait-caption"><span>{work.titleEn}</span><span>Olga Trikhleb · PETIT.SOT</span></div></section>}
      <section className="about-section">
        <div className="about-section-label"><span>01</span><span>Informácie o diele</span></div>
        <div className="about-section-copy">
          <h2>{work.titleEn} — autorská maľba</h2>
          <p>{description}</p>
          <p><strong>Technika:</strong> {medium}<br /><strong>Rozmery:</strong> {work.size}<br /><strong>Rok:</strong> {work.year}<br /><strong>Stav:</strong> {availability}</p>
          {work.available && <p><strong>Cena:</strong> {work.price > 0 ? new Intl.NumberFormat("sk-SK", { style: "currency", currency: work.currency }).format(work.price) : "Cena na vyžiadanie"}</p>}
          <p>Originálne diela Olgy Trikhleb sú prezentované prostredníctvom PETIT.SOT STUDIO, nezávislého umeleckého projektu so sídlom v Trenčíne na Slovensku.</p>
        </div>
      </section>
      <section className="about-section">
        <div className="about-section-label"><span>02</span><span>Nákup a kontakt</span></div>
        <div className="about-section-copy">
          <h2>{work.available ? "Záujem o tento originálny obraz?" : "Zaujalo vás toto dielo?"}</h2>
          <p>{work.available ? "Ak máte záujem o kúpu, pozrite si kompletné informácie a dostupné možnosti objednávky na stránke diela." : "Toto dielo momentálne nie je dostupné. Môžete sa však informovať o podobnej autorskej maľbe na objednávku."}</p>
          <Link className="arrow-link" href={"/works/" + work.slug}>{work.available ? "Kúpiť originálny obraz" : "Pozrieť detail diela"} <span>↗</span></Link>
          <Link className="arrow-link" href="/commission">Maľba na objednávku <span>↗</span></Link>
        </div>
      </section>
      <section className="about-originals">
        <p className="eyebrow">PETIT.SOT STUDIO · TRENČÍN, SLOVENSKO</p>
        <p className="about-originals-statement">Originálna maľba od nezávislej maliarky Olgy Trikhleb.</p>
        <div className="about-originals-bottom"><span>Trenčín · Slovensko</span><Link className="arrow-link" href="/sk/obrazy">Všetky obrazy <span>↗</span></Link></div>
      </section>
    </main>
  );
}

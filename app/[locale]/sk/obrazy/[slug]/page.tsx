import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWork } from "../../../../../lib/works";

const SITE_URL = "https://www.petitsot.com";

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

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) return {};
  const artworkTitle = work.titleSk || work.titleEn;
  const artworkDescription = work.descriptionSk || `${artworkTitle} je originálne umelecké dielo Olgy Trikhleb.`;
  const title = artworkTitle + " — originálny obraz od Olgy Trikhleb | PETIT.SOT";
  const availability = work.available ? "Dostupný originálny obraz." : work.sold ? "Originálny obraz bol predaný." : "Dielo je súčasťou archívu.";
  const description = artworkDescription + " " + availability + " " + slovakMedium(work.medium) + ", " + work.size + ", " + work.year + ". Pozrite si fotografie a informácie o diele.";
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
      ...(work.imageUrl ? { images: [{ url: work.imageUrl, alt: work.imageAlts.sk[0] }] } : {}),
    },
  };
}

export default async function SlovakArtworkPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) notFound();
  const canonical = SITE_URL + "/sk/obrazy/" + work.slug;
  const artworkTitle = work.titleSk || work.titleEn;
  const artworkDescription = work.descriptionSk || `${artworkTitle} je originálne umelecké dielo Olgy Trikhleb.`;
  const medium = slovakMedium(work.medium);
  const availability = work.available ? "Dostupný originálny obraz" : work.sold ? "Predané" : "Dielo v archíve";
  const description = artworkDescription + " Technika: " + medium + "; rozmery: " + work.size + "; rok: " + work.year + ". " + availability + ".";
  const artworkSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical + "#webpage",
        url: canonical,
        name: artworkTitle + " — originálny obraz Olgy Trikhleb",
        description,
        inLanguage: "sk",
        about: { "@id": canonical + "#artwork" },
      },
      {
        "@type": "VisualArtwork",
        "@id": canonical + "#artwork",
        name: artworkTitle,
        description,
        image: work.images.length ? work.images : work.imageUrl ? [work.imageUrl] : [],
        url: canonical,
        artform: "Maľba",
        artMedium: medium,
        creator: { "@id": SITE_URL + "/#artist" },
        artist: { "@type": "Person", "@id": SITE_URL + "/#artist", name: "Olga Trikhleb", url: SITE_URL + "/about" },
        ...(work.price > 0 ? { offers: { "@type": "Offer", url: canonical, priceCurrency: "EUR", price: work.price, availability: work.available ? "https://schema.org/InStock" : work.sold ? "https://schema.org/SoldOut" : "https://schema.org/OutOfStock" } } : {}),
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
        <h1>{artworkTitle}<br /><i>Originálny obraz.</i></h1>
        <div className="about-lead">
          <span className="about-index">PETIT.SOT / {work.year}</span>
          <p>{description}</p>
        </div>
      </section>
      {work.imageUrl && <section className="about-portrait"><div className="about-portrait-image"><img src={work.imageUrl} alt={work.imageAlts.sk[0]} loading="eager" /></div><div className="about-portrait-caption"><span>{artworkTitle}</span><span>Olga Trikhleb · PETIT.SOT</span></div></section>}
      <section className="about-section">
        <div className="about-section-label"><span>01</span><span>Informácie o diele</span></div>
        <div className="about-section-copy">
          <h2>{artworkTitle} — autorská maľba</h2>
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
          <Link className="arrow-link" href={"/sk/obrazy/" + work.slug}>{work.available ? "Kúpiť originálny obraz" : "Pozrieť detail diela"} <span>↗</span></Link>
          <Link className="arrow-link" href="/sk/malba-na-objednavku">Maľba na objednávku <span>↗</span></Link>
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

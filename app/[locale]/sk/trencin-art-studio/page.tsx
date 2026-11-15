import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.petitsot.com";
const PAGE_URL = `${SITE_URL}/sk/trencin-art-studio`;

export async function generateMetadata(): Promise<Metadata> {
  const title = "Maliarka v Trenčíne | Originálne obrazy na predaj – PETIT.SOT";
  const description = "Olga Trikhleb je nezávislá maliarka pôsobiaca v Trenčíne. Objavte originálne obrazy, krajiny a mestské motívy, prezrite si dostupné diela alebo sa informujte o maľbe na objednávku.";
  return {
    title,
    description,
    alternates: {
      canonical: PAGE_URL,
      languages: {
        sk: PAGE_URL,
        en: `${SITE_URL}/trencin-art-studio`,
        "x-default": `${SITE_URL}/trencin-art-studio`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: PAGE_URL,
      siteName: "PETIT.SOT STUDIO",
      locale: "sk_SK",
    },
  };
}

export default function SlovakTrencinArtStudio() {
  const questions = [
    {
      question: "Kde si môžem pozrieť originálne obrazy?",
      answer: "Aktuálnu kolekciu PETIT.SOT STUDIO nájdete v online katalógu. Pri každom diele sú uvedené fotografie, rozmery, technika a informácia o dostupnosti.",
    },
    {
      question: "Dajú sa obrazy objednať aj na mieru?",
      answer: "Áno. Môžete poslať predstavu o motíve, preferovaný rozmer a prípadné referenčné fotografie. Podrobnosti, cenu a termín vytvorenia si dohodnete priamo so štúdiom pred potvrdením objednávky.",
    },
    {
      question: "Kde pôsobí PETIT.SOT STUDIO?",
      answer: "PETIT.SOT STUDIO je nezávislé online umelecké štúdio maliarky Olgy Trikhleb so zázemím v Trenčíne na Slovensku. Kolekcia je prezentovaná online; nejde o verejnú galériu s pravidelnými otváracími hodinami.",
    },
  ];
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${PAGE_URL}#webpage`,
        url: PAGE_URL,
        name: "Maliarka v Trenčíne — Olga Trikhleb | PETIT.SOT STUDIO",
        description: "Originálne obrazy na predaj a maľba na objednávku od nezávislej maliarky pôsobiacej v Trenčíne.",
        inLanguage: "sk",
        about: { "@id": `${SITE_URL}/#artist` },
        mainEntity: { "@id": `${SITE_URL}/#studio` },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#artist`,
        name: "Olga Trikhleb",
        url: `${SITE_URL}/about`,
        jobTitle: "Maliarka",
        homeLocation: { "@type": "City", name: "Trenčín", containedInPlace: { "@type": "Country", name: "Slovensko" } },
        worksFor: { "@id": `${SITE_URL}/#studio` },
        sameAs: ["https://www.instagram.com/petit.sot.art"],
        knowsAbout: ["Originálna maľba", "Krajinomaľba", "Mestské motívy", "Súčasné výtvarné umenie"],
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#studio`,
        name: "PETIT.SOT STUDIO",
        url: SITE_URL,
        description: "Nezávislé online umelecké štúdio maliarky Olgy Trikhleb so zázemím v Trenčíne.",
        areaServed: { "@type": "City", name: "Trenčín" },
        founder: { "@id": `${SITE_URL}/#artist` },
        sameAs: ["https://www.instagram.com/petit.sot.art", "https://petitsot.etsy.com", "https://www.sashe.sk/petitsot"],
      },
      {
        "@type": "FAQPage",
        "@id": `${PAGE_URL}#faq`,
        mainEntity: questions.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };

  return (
    <main className="text-page about-page" lang="sk">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="about-hero">
        <p className="eyebrow">PETIT.SOT STUDIO · TRENČÍN, SLOVENSKO</p>
        <h1>Maliarka<br /><i>z Trenčína.</i></h1>
        <div className="about-lead">
          <span className="about-index">PETIT.SOT / TRENČÍN</span>
          <p>Originálne obrazy a autorská maľba od Olgy Trikhleb, nezávislej maliarky pôsobiacej v Trenčíne. Objavte jedinečné diela inšpirované krajinou, mestom, farbou a atmosférou každodenných okamihov.</p>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>01</span><span>O maliarke</span></div>
        <div className="about-section-copy">
          <h2>Autorská tvorba z Trenčína.</h2>
          <p>Olga Trikhleb je nezávislá výtvarníčka a autorka projektu PETIT.SOT STUDIO. Vo svojej tvorbe sa venuje originálnej maľbe, krajinám, mestským scénam a výjavom z každodenného života. Dôležitú úlohu v jej obrazoch zohráva farba, kompozícia a nálada zachyteného okamihu.</p>
          <p>Štúdio pôsobí v Trenčíne na Slovensku a svoju tvorbu predstavuje prostredníctvom online kolekcie.</p>
          <Link className="arrow-link" href="/about">Viac o maliarke <span>↗</span></Link>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>02</span><span>Obrazy na predaj</span></div>
        <div className="about-section-copy">
          <h2>Originálne obrazy, nie reprodukcie.</h2>
          <p>V online katalógu nájdete dostupné originálne obrazy Olgy Trikhleb. Pri každom diele si môžete pozrieť fotografie, rozmery, použitú techniku a aktuálnu dostupnosť. Kolekcia zahŕňa krajiny, mestské motívy a ďalšie autorské námety.</p>
          <Link className="arrow-link" href="/works">Pozrieť obrazy na predaj <span>↗</span></Link>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>03</span><span>Maľba na objednávku</span></div>
        <div className="about-section-copy">
          <h2>Obraz vytvorený podľa vašej predstavy.</h2>
          <p>Ak hľadáte obraz na mieru, môžete sa informovať o autorskej maľbe na objednávku. Pošlite nám námet, preferovaný rozmer a prípadné referencie. Spoločne preberieme možnosti, cenu a predpokladaný termín ešte pred potvrdením objednávky.</p>
          <Link className="arrow-link" href="/commission">Objednať originálny obraz <span>↗</span></Link>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>04</span><span>Nákup a informácie</span></div>
        <div className="about-section-copy">
          <h2>Ako kúpiť obraz?</h2>
          <p>Vyberte si dielo z online kolekcie a otvorte jeho detail. Ak potrebujete doplniť informácie o dostupnosti, cene alebo doručení, kontaktujte PETIT.SOT STUDIO. Radi vám poskytneme podrobnosti pred nákupom.</p>
          <Link className="arrow-link" href="/contact">Kontaktovať štúdio <span>↗</span></Link>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>05</span><span>Časté otázky</span></div>
        <div className="about-section-copy">
          <h2>Čo vás zaujíma?</h2>
          {questions.map((item) => (
            <div key={item.question} style={{ marginBottom: "26px" }}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-originals">
        <p className="eyebrow">PETIT.SOT STUDIO · ORIGINÁLNA MAĽBA</p>
        <p className="about-originals-statement">Nezávislé umenie. Originálne obrazy. Tvorba z Trenčína.</p>
        <div className="about-originals-bottom">
          <span>Olga Trikhleb · Maliarka</span>
          <Link className="arrow-link" href="/contact">Napíšte nám <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}

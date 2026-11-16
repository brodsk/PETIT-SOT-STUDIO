import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.petitsot.com";
const PAGE_URL = SITE_URL + "/sk/malba-na-objednavku";

export const metadata: Metadata = {
  title: "Maľba na objednávku | Originálny obraz na mieru — PETIT.SOT",
  description: "Objednajte si originálny obraz od maliarky Olgy Trikhleb. Dohodnite si motív, rozmery a farebnosť autorskej maľby v PETIT.SOT STUDIO v Trenčíne na Slovensku.",
  alternates: {
    canonical: PAGE_URL,
    languages: {
      sk: PAGE_URL,
      en: SITE_URL + "/commission",
      ru: SITE_URL + "/ru/commission",
      "x-default": SITE_URL + "/commission",
    },
  },
  openGraph: {
    type: "website",
    title: "Maľba na objednávku — PETIT.SOT STUDIO",
    description: "Originálna autorská maľba na mieru od Olgy Trikhleb z Trenčína. Informujte sa o možnostiach objednávky.",
    url: PAGE_URL,
    siteName: "PETIT.SOT STUDIO",
    locale: "sk_SK",
  },
};

const questions = [
  {
    question: "Môžem si objednať obraz podľa vlastnej predstavy?",
    answer: "Áno. Pošlite predstavu o motíve, približné rozmery a farebnosť, prípadne referenčné fotografie. Olga s vami preberie možnosti vytvorenia originálneho diela.",
  },
  {
    question: "Ako sa určuje cena obrazu na objednávku?",
    answer: "Cena závisí od rozmerov a náročnosti konkrétneho motívu. Konečná cena a predpokladaný termín sa dohodnú vopred, ešte pred potvrdením objednávky.",
  },
  {
    question: "Odkiaľ pôsobí PETIT.SOT STUDIO?",
    answer: "PETIT.SOT STUDIO je nezávislé umelecké štúdio maliarky Olgy Trikhleb so zázemím v Trenčíne na Slovensku. Dopyty je možné poslať online.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": PAGE_URL + "#webpage",
      url: PAGE_URL,
      name: "Maľba na objednávku — Olga Trikhleb",
      description: "Originálne obrazy vytvorené na objednávku od maliarky Olgy Trikhleb z Trenčína.",
      inLanguage: "sk",
      about: { "@id": SITE_URL + "/#artist" },
    },
    {
      "@type": "FAQPage",
      "@id": PAGE_URL + "#faq",
      mainEntity: questions.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function SlovakCommissionPage() {
  return (
    <main className="text-page about-page" lang="sk">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="about-hero">
        <p className="eyebrow">PETIT.SOT STUDIO · TRENČÍN, SLOVENSKO</p>
        <h1>Maľba na<br /><i>objednávku.</i></h1>
        <div className="about-lead">
          <span className="about-index">OLGA TRIKHLEB / COMMISSIONS</span>
          <p>Hľadáte originálny obraz vytvorený podľa vašej predstavy? Maliarka Olga Trikhleb prijíma dopyty na autorskú maľbu. Spoločne môžete prebrať námet, rozmery, farebnosť a charakter diela ešte pred potvrdením objednávky.</p>
        </div>
      </section>
      <section className="about-section">
        <div className="about-section-label"><span>01</span><span>Váš námet</span></div>
        <div className="about-section-copy">
          <h2>Originálny obraz podľa vašej predstavy.</h2>
          <p>Opíšte motív, ktorý by ste chceli vidieť na obraze. Môže ísť o krajinu, miesto s osobným významom, mestskú scénu alebo inú tému, ktorú chcete spracovať formou autorskej maľby.</p>
        </div>
      </section>
      <section className="about-section">
        <div className="about-section-label"><span>02</span><span>Rozmery a cena</span></div>
        <div className="about-section-copy">
          <h2>Jasné podmienky pred začiatkom práce.</h2>
          <p>Pri dopyte uveďte približný rozmer a prípadné referenčné fotografie. Cena závisí od veľkosti a náročnosti motívu; konečnú ponuku a orientačný termín dostanete pred potvrdením objednávky.</p>
        </div>
      </section>
      <section className="about-section">
        <div className="about-section-label"><span>03</span><span>O štúdiu</span></div>
        <div className="about-section-copy">
          <h2>Nezávislá maliarka z Trenčína.</h2>
          <p>Olga Trikhleb rozvíja svoju autorskú tvorbu v PETIT.SOT STUDIO, nezávislom umeleckom projekte so zázemím v Trenčíne na Slovensku. Dopyty na obrazy na objednávku prijíma online.</p>
          <Link className="arrow-link" href="/sk/trencin-art-studio">Viac o maliarke a štúdiu <span>↗</span></Link>
          <Link className="arrow-link" href="/sk/obrazy">Pozrieť originálne obrazy <span>↗</span></Link>
        </div>
      </section>
      <section className="about-section">
        <div className="about-section-label"><span>04</span><span>Časté otázky</span></div>
        <div className="about-section-copy">
          <h2>Informácie o objednávke.</h2>
          {questions.map((item) => <div key={item.question} style={{ marginBottom: "24px" }}><h3>{item.question}</h3><p>{item.answer}</p></div>)}
          <Link className="arrow-link" href="/commission">Odoslať dopyt na obraz <span>↗</span></Link>
        </div>
      </section>
      <section className="about-originals">
        <p className="eyebrow">PETIT.SOT STUDIO · ORIGINÁLNA MAĽBA</p>
        <p className="about-originals-statement">Váš motív. Autorská maľba. Jedinečný originál.</p>
        <div className="about-originals-bottom"><span>Olga Trikhleb · Trenčín</span><Link className="arrow-link" href="/commission">Začať objednávku <span>↗</span></Link></div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";

const SITE_URL = "https://petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru ? "Об Ольге Трихлеб — PETIT.SOT STUDIO" : "About Olga Trikhleb — PETIT.SOT STUDIO";
  const description = ru
    ? "О художнице Ольге Трихлеб и PETIT.SOT STUDIO — живопись, эксперименты и визуальные исследования."
    : "About contemporary artist Olga Trikhleb and PETIT.SOT STUDIO — paintings, experiments and visual research.";
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: { title, description, url: `${SITE_URL}/about` },
  };
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  return <main className="text-page"><p className="eyebrow">{ru ? "О студии" : "About the studio"}</p><h1>Olga<br/><i>Trikhleb.</i></h1><div className="text-columns"><p>{ru ? "PETIT.SOT STUDIO — цифровое пространство художницы Ольги Трихлеб: живопись, эксперименты и визуальные исследования." : "PETIT.SOT STUDIO is the digital space of artist Olga Trikhleb — an evolving archive of paintings, experiments and visual research."}</p><p>{ru ? "Каждая работа существует как самостоятельный объект, а архив постепенно растёт, не подчиняясь одной заранее заданной истории." : "Each work is treated as an independent object while the archive grows slowly, without forcing a single narrative onto the paintings."}</p></div></main>;
}

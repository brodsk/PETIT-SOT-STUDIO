import type { Metadata } from "next";
import CommissionBuilder from "./CommissionBuilder";
import CommissionSeoContent from "./CommissionSeoContent";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru
    ? "Картины на заказ — Ольга Трихлеб"
    : "Maľba na objednávku a obrazy na mieru | PETIT.SOT STUDIO";
  const description = ru
    ? "Закажите оригинальную картину у художницы Ольги Трихлеб. Индивидуальный сюжет, размер и палитра, предварительная оценка стоимости и личное обсуждение заказа."
    : "Commission an original painting by artist Olga Trikhleb. Create a personalised landscape or seascape with your preferred size, colours and subject. Request a custom artwork.";
  const url = `${SITE_URL}${ru ? "/ru" : ""}/commission`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/commission`,
        ru: `${SITE_URL}/ru/commission`,
        "x-default": `${SITE_URL}/commission`,
      },
    },
    openGraph: { type: "website", siteName: "PETIT.SOT STUDIO", title, description, url, locale: ru ? "ru_RU" : "en_GB" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CommissionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  return (
    <>
      <CommissionBuilder ru={ru} />
      <CommissionSeoContent ru={ru} />
    </>
  );
}

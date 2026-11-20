import type { Metadata } from "next";
import CommissionBuilder from "./CommissionBuilder";
import CommissionSeoContent from "./CommissionSeoContent";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  const title = ru
    ? "Картины на заказ — авторская живопись Ольги Трихлеб"
    : sk ? "Originálny obraz na objednávku | Olga Trikhleb" : "Commission an Original Painting Online | Olga Trikhleb";
  const description = ru
    ? "Закажите оригинальную картину у художницы Ольги Трихлеб онлайн. Авторский сюжет, индивидуальный размер и цветовая палитра, предварительная оценка стоимости и личное обсуждение заказа."
    : "Commission a one-of-a-kind original painting by contemporary artist Olga Trikhleb. Request a custom landscape, seascape or meaningful place with your preferred canvas size and colour palette. Enquiries welcome from collectors worldwide.";
  const url = sk ? `${SITE_URL}/sk/malba-na-objednavku` : `${SITE_URL}${ru ? "/ru" : ""}/commission`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/commission`,
        ru: `${SITE_URL}/ru/commission`,
        sk: `${SITE_URL}/sk/malba-na-objednavku`,
        "x-default": `${SITE_URL}/commission`,
      },
    },
    openGraph: { type: "website", siteName: "PETIT.SOT STUDIO", title, description, url, locale: ru ? "ru_RU" : sk ? "sk_SK" : "en_GB" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CommissionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  return (
    <>
      <CommissionBuilder ru={ru} sk={sk} />
      <CommissionSeoContent ru={ru} sk={sk} />
    </>
  );
}

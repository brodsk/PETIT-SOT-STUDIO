import type { Metadata } from "next";
import CommissionBuilder from "./CommissionBuilder";
import CommissionSeoContent from "./CommissionSeoContent";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru
    ? "Картины на заказ — авторская живопись Ольги Трихлеб | PETIT.SOT"
    : "Custom Original Paintings & Art Commissions | Olga Trikhleb — PETIT.SOT";
  const description = ru
    ? "Закажите оригинальную картину у художницы Ольги Трихлеб. Индивидуальный сюжет, размер и палитра, предварительная оценка стоимости и личное обсуждение заказа."
    : "Commission an original, hand-painted artwork by artist Olga Trikhleb. Create a personalised landscape or seascape with your preferred size, colours and subject. Request a custom painting.";
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
    openGraph: {
      type: "website",
      siteName: "PETIT.SOT STUDIO",
      title,
      description,
      url,
      locale: ru ? "ru_RU" : "en_GB",
      images: [{ url: "/og-image.jpg", alt: ru ? "Авторская живопись PETIT.SOT — картины на заказ" : "PETIT.SOT original painting commissions" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
    },
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

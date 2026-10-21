import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWork } from "../../../../lib/works";
import PhotoWallPreview from "../../ar-test/PhotoWallPreview";

const SITE_URL = "https://www.petitsot.com";

function getDimensions(size: string) {
  const match = (size || "").match(/([\\d.,]+)\\s*×\\s*([\\d.,]+)/);
  return {
    width: match ? Number(match[1].replace(",", ".")) : 0,
    height: match ? Number(match[2].replace(",", ".")) : 0,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const work = await getWork(slug);
  if (!work) return {};
  const ru = locale === "ru";
  const title = ru ? work.titleRu : work.titleEn;
  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/wall-preview/${work.slug}`;
  return {
    title: ru ? `Примерка «${title}» на стене — PETIT.SOT` : `Preview ${title} on Your Wall — PETIT.SOT`,
    description: ru
      ? `Посмотрите, как картина «${title}» будет выглядеть на вашей стене. Загрузите фото комнаты и настройте размещение.`
      : `See how “${title}” by Olga Trikhleb could look on your wall. Upload a room photo and adjust its placement.`,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/wall-preview/${work.slug}`,
        ru: `${SITE_URL}/ru/wall-preview/${work.slug}`,
        "x-default": `${SITE_URL}/wall-preview/${work.slug}`,
      },
    },
    robots: { index: false, follow: true },
  };
}

export default async function ArtworkWallPreview({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const ru = locale === "ru";
  const work = await getWork(slug);
  if (!work || !work.imageUrl) notFound();
  const dimensions = getDimensions(work.size || "");
  const artworkChoices = [{
    id: work.id ?? work.slug,
    slug: work.slug,
    title: ru ? work.titleRu : work.titleEn,
    image: work.imageUrl,
    width: dimensions.width,
    height: dimensions.height,
  }];
  const title = ru ? work.titleRu : work.titleEn;
  return (
    <main className="ar-page">
      <div className="ar-page-head">
        <span className="eyebrow">PETIT.SOT / PHOTO PREVIEW</span>
        <h1>{ru ? `Примерка «${title}» на своей стене` : `Preview “${title}” on your wall`}</h1>
        <p>{ru ? "Загрузите фото комнаты, чтобы увидеть именно эту картину на своей стене." : "Upload a room photo to see this specific painting on your wall."}</p>
      </div>
      <PhotoWallPreview ru={ru} artworkChoices={artworkChoices} initialArtwork={work.slug} />
    </main>
  );
}

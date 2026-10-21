import type { Metadata } from "next";
import {getWorks} from "../../../lib/works";
import PhotoWallPreview from "../ar-test/PhotoWallPreview";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = SITE_URL + (locale === "ru" ? "/ru" : "") + "/wall-preview";
  const ru = locale === "ru";
  return {
    title: ru ? "Примерка картины на стене — PETIT.SOT" : "Preview Art on Your Wall — PETIT.SOT",
    description: ru
      ? "Посмотрите, как оригинальная картина Ольги Трихлеб будет выглядеть на вашей стене. Загрузите фото комнаты и настройте размещение."
      : "See how an original Olga Trikhleb painting could look on your wall. Upload a room photo and adjust the artwork placement.",
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/wall-preview`,
        ru: `${SITE_URL}/ru/wall-preview`,
        "x-default": `${SITE_URL}/wall-preview`,
      },
    },
    robots: { index: false, follow: true },
  };
}

function getDimensions(size:string){
  const match=(size||"").match(/([\\d.,]+)\\s*×\\s*([\\d.,]+)/);
  return {
    width:match?Number(match[1].replace(",",".")):0,
    height:match?Number(match[2].replace(",",".")):0
  };
}

export default async function WallPreview({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{work?: string}>;
}) {
  const {locale}=await params;
  const {work: selectedWork}=await searchParams;
  const ru=locale==="ru";
  const works=await getWorks();
  const artworkChoices=works.filter(w=>w.imageUrl).map((w,index)=>{
    const dimensions=getDimensions(w.size||"");
    return {
      id:w.id ?? `artwork-${index}`,
      slug:w.slug,
      title:ru?w.titleRu:w.titleEn,
      image:w.imageUrl!,
      width:dimensions.width,
      height:dimensions.height
    };
  });
  return <main className="ar-page">
    <div className="ar-page-head">
      <span className="eyebrow">PETIT.SOT / PHOTO PREVIEW</span>
      <h1>{ru?"Примерьте картину на свою стену":"Preview artwork on your wall"}</h1>
      <p>{ru?"Загрузите фото комнаты, выберите картину и настройте её положение и перспективу.":"Upload a room photo, choose an artwork, and adjust its position and perspective."}</p>
    </div>
    {artworkChoices.length ? <PhotoWallPreview ru={ru} artworkChoices={artworkChoices} initialArtwork={selectedWork}/> : <p>{ru?"Нет доступных работ.":"No artwork available."}</p>}
  </main>;
}

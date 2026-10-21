import type { Metadata } from "next";
import {getWorks} from "../../../lib/works";
import PhotoWallPreview from "./PhotoWallPreview";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = SITE_URL + (locale === "ru" ? "/ru" : "") + "/ar-test";

  return {
    title: "Wall Photo Preview — PETITSOT",
    alternates: { canonical },
    robots: { index: false, follow: true },
  };
}

function getDimensions(size:string){
  const match=(size||"").match(/([\d.,]+)\s*×\s*([\d.,]+)/);
  return {
    width:match?Number(match[1].replace(",",".")):0,
    height:match?Number(match[2].replace(",",".")):0
  };
}

export default async function ARTest({
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
      <span className="eyebrow">PETIT.SOT / WALL PREVIEW</span>
      <h1>{ru?"Примерьте картину на свою стену":"Preview artwork on your wall"}</h1>
      <p>{ru?"Загрузите фото комнаты, выберите картину и настройте её положение и перспективу. Пока мы дорабатываем AR, используйте этот режим для примерки картины на фото вашей стены.":"Upload a room photo, choose an artwork, and adjust its position and perspective. Use this photo-based preview while we continue improving the live AR mode."}</p>
    </div>
    {artworkChoices.length ? <PhotoWallPreview ru={ru} artworkChoices={artworkChoices} initialArtwork={selectedWork}/> : <p>{ru?"Нет доступных работ.":"No artwork available."}</p>}
  </main>;
}

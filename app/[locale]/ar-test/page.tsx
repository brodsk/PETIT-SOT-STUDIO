import type { Metadata } from "next";
import {getWorks} from "../../../lib/works";
import PhotoWallPreview from "./PhotoWallPreview";
import DeviceARPreview from "./DeviceARPreview";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = SITE_URL + (locale === "ru" ? "/ru" : "") + "/ar-test";

  return {
    title: "AR Wall Preview — PETITSOT",
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

export default async function ARTest({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  const ru=locale==="ru";
  const works=await getWorks();
  const work=works.find(w=>w.imageUrl);
  const {width,height}=getDimensions(work?.size||"");
  const artworkChoices=works.filter(w=>w.imageUrl).map((w,index)=>{
    const dimensions=getDimensions(w.size||"");
    return {
      id:w.id ?? `artwork-${index}`,
      title:ru?w.titleRu:w.titleEn,
      image:w.imageUrl!,
      width:dimensions.width,
      height:dimensions.height
    };
  });
  return <main className="ar-page">
    <div className="ar-page-head"><span className="eyebrow">PETIT.SOT / AR</span><h1>{ru?"Картина на вашей стене":"Your wall, your artwork"}</h1><p>{ru?"Режим автоматически выбирается для телефона: стандартный AR для Android и живое размещение на стене для iPhone.":"The AR mode is selected for your phone: native Android AR or live wall placement on iPhone."}</p></div>
    {work?<><DeviceARPreview ru={ru} artworkChoices={artworkChoices}/><PhotoWallPreview ru={ru} artworkChoices={artworkChoices}/></>:<p>{ru?"Нет доступных работ.":"No artwork available."}</p>}
  </main>;
}

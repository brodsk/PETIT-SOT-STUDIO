import {getWorks} from "../../../lib/works";
import ARWallPreview from "./ARWallPreview";
import PhotoWallPreview from "./PhotoWallPreview";

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
    <div className="ar-page-head"><span className="eyebrow">AR / TEST</span><h1>{ru?"Картина на вашей стене":"Your wall, your artwork"}</h1><p>{ru?"Сначала примерьте работу на фото комнаты. Живой AR доступен только на совместимых устройствах и пока работает экспериментально.":"First preview the artwork on a room photo. Live AR is experimental and only works on compatible devices."}</p></div>
    {work?<><PhotoWallPreview ru={ru} artworkChoices={artworkChoices}/><div className="ar-live-experimental"><span className="eyebrow">{ru?"ЭКСПЕРИМЕНТАЛЬНЫЙ РЕЖИМ":"EXPERIMENTAL MODE"}</span><p>{ru?"Живой AR зависит от возможностей телефона и может не обнаруживать вертикальные поверхности.":"Live AR depends on device support and may not detect vertical surfaces."}</p><ARWallPreview imageUrl={work.imageUrl} title={ru?work.titleRu:work.titleEn} width={width} height={height} ru={ru} artworkChoices={artworkChoices}/></div></>:<p>{ru?"Нет доступных работ.":"No artwork available."}</p>}
  </main>;
}

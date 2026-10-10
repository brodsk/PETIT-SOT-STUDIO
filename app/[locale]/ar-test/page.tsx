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
    <div className="ar-page-head"><span className="eyebrow">AR / TEST</span><h1>{ru?"Картина на вашей стене":"Your wall, your artwork"}</h1><p>{ru?"Живая AR-версия: камера видит стену, а картина становится настоящим 3D-объектом.":"Live AR: the camera detects the wall and the artwork becomes a real 3D object."}</p></div>
    {work?<><ARWallPreview imageUrl={work.imageUrl} title={ru?work.titleRu:work.titleEn} width={width} height={height} ru={ru} artworkChoices={artworkChoices}/><PhotoWallPreview ru={ru} artworkChoices={artworkChoices}/></>:<p>{ru?"Нет доступных работ.":"No artwork available."}</p>}
  </main>;
}

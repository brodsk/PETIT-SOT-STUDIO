import {getWorks} from "../../../lib/works";
import ARWallPreview from "./ARWallPreview";

export default async function ARTest({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  const ru=locale==="ru";
  const works=await getWorks();
  const work=works.find(w=>w.imageUrl);
  const dimensions=(work?.size||"").match(/([\d.,]+)\s*×\s*([\d.,]+)/);
  const width=dimensions?Number(dimensions[1].replace(",",".")):0;
  const height=dimensions?Number(dimensions[2].replace(",",".")):0;
  return <main className="ar-page">
    <div className="ar-page-head"><span className="eyebrow">AR / TEST</span><h1>{ru?"Картина на вашей стене":"Your wall, your artwork"}</h1><p>{ru?"Живая AR-версия: камера видит стену, а картина становится настоящим 3D-объектом.":"Live AR: the camera detects the wall and the artwork becomes a real 3D object."}</p></div>
    {work?<ARWallPreview imageUrl={work.imageUrl} title={ru?work.titleRu:work.titleEn} width={width} height={height} ru={ru}/>:<p>{ru?"Нет доступных работ.":"No artwork available."}</p>}
  </main>;
}

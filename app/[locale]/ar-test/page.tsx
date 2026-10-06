import {getWorks} from "../../../lib/works";
import ARWallPreview from "./ARWallPreview";

export default async function ARTest({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  const ru=locale==="ru";
  const works=await getWorks();
  const work=works.find(w=>w.imageUrl);
  return <main className="ar-page">
    <div className="ar-page-head">
      <span className="eyebrow">AR / TEST</span>
      <h1>{ru?"Картина на вашей стене":"Your wall, your artwork"}</h1>
      <p>{ru?"Тестовая версия просмотра картины через камеру.":"Experimental live camera preview for PETIT.SOT artworks."}</p>
    </div>
    {work?<ARWallPreview imageUrl={work.imageUrl} title={ru?work.titleRu:work.titleEn} width={Number.parseFloat(work.size)||0} height={Number.parseFloat(work.size.split("×")[1])||0} ru={ru}/>:<p>{ru?"Нет доступных работ.":"No artwork available."}</p>}
  </main>;
}

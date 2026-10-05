import Link from "next/link";
import {getWorks,localizeMedium} from "../../../lib/works";

export default async function Works({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 const ru=locale==="ru";
 const works=await getWorks();
 return <main className="archive gallery-archive">
   <div className="archive-mast"><span className="eyebrow">{ru?"Архив":"Archive"}</span><h1>{ru?"Работы":"Works"}</h1><p>{ru?"Картины и визуальные исследования Ольги Трихлеб.":"Paintings and visual research by Olga Trikhleb."}</p></div>
   <div className="archive-grid archive-grid-even">
    {works.map((w,i)=><Link className="archive-card" href={"/"+locale+"/works/"+w.slug} key={w.slug}>
     <div className="archive-image art-placeholder">{w.imageUrl?<img src={w.imageUrl} alt={ru?w.titleRu:w.titleEn} loading="lazy" decoding="async"/>:<><span>{String(i+1).padStart(2,"0")}</span><small>IMAGE</small></>}</div>
     <div className="archive-card-meta"><span>{ru?w.titleRu:w.titleEn}</span><span>{w.year}</span></div>
     <p>{localizeMedium(w.medium,ru?"ru":"en")}</p>
    </Link>)}
   </div>
 </main>
}

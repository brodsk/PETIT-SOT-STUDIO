import Link from "next/link";
import {works} from "../../../data/works";

export default async function Works({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params; const ru=locale==="ru";
 return <main className="archive gallery-archive">
   <div className="archive-mast"><span className="eyebrow">{ru?"Архив":"Archive"}</span><h1>{ru?"Работы":"Works"}</h1><p>{ru?"Картины и визуальные исследования Ольги Трихлеб.":"Paintings and visual research by Olga Trikhleb."}</p></div>
   <div className="archive-grid">{works.map((w,i)=><Link className={"archive-card archive-card-"+i} href={"/"+locale+"/works/"+w.slug} key={w.slug}>
     <div className="archive-image art-placeholder"><span>{String(i+1).padStart(2,"0")}</span><small>IMAGE</small></div>
     <div className="archive-card-meta"><span>{w.title}</span><span>{w.year}</span></div>
     <p>{w.medium}</p>
   </Link>)}</div>
 </main>
}
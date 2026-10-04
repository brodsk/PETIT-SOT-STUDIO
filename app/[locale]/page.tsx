import Link from "next/link";
import {getWorks} from "../../lib/works";

const logoTop = [
  ["P", 105], ["E", 205], ["T", 305], ["I", 405], ["T", 485],
  [".", 585], ["S", 640], ["O", 750], ["T", 865],
] as const;

const logoBottom = [
  ["S", 385], ["T", 500], ["U", 610], ["D", 735], ["I", 850], ["O", 910],
] as const;

export default async function Home({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 const ru=locale==="ru";
 const works=await getWorks();
 const first=works[0];

 return <main className="gallery-home">
  <section className="hero-gallery">
   <div className="hero-top"><span>OLGA TRIKHLEB</span><span className="hero-artist">{ru?"Художница":"Artist"} / {new Date().getFullYear()}</span></div>

   <div className="hero-title-wrap">
    <div className="hero-wordmark">PETIT.SOT <span className="wordmark-divider">|</span> <span>STUDIO</span></div>
    <span className="hero-orbit hero-orbit-a"></span><span className="hero-orbit hero-orbit-b"></span>
   </div>

   <div className="hero-bottom"><p>{ru?"Живопись, исследования и визуальные фрагменты.":"Painting, studies and visual fragments."}</p><Link className="arrow-link" href={"/"+locale+"/works"}>{ru?"Смотреть работы":"View works"} <span>↗</span></Link></div>
  </section>

  {first && <section className="gallery-intro">
   <div className="gallery-number">01 / {String(works.length).padStart(2,"0")}</div>
   <Link href={"/"+locale+"/works/"+first.slug} className="hero-art art-placeholder" aria-label={ru?first.titleRu:first.titleEn}>
    {first.imageUrl?<img src={first.imageUrl} alt={ru?first.titleRu:first.titleEn}/>:<><span>01</span><small>{ru?"РАБОТА БУДЕТ ДОБАВЛЕНА":"ARTWORK TO BE ADDED"}</small></>}
   </Link>
   <div className="gallery-caption"><span>{ru?first.titleRu:first.titleEn}</span><span>{first.year}</span></div>
  </section>}

  <section className="gallery-tiles">
   <div className="gallery-tiles-head"><span>{ru?"Архив":"Archive"}</span><span>{String(works.length).padStart(2,"0")} {ru?"работ":"works"}</span></div>
   <div className="gallery-tiles-grid">
    {works.slice(1).map((w,i)=><Link href={"/"+locale+"/works/"+w.slug} className="gallery-tile" key={w.slug}>
      <div className="art-placeholder">{w.imageUrl?<img src={w.imageUrl} alt={ru?w.titleRu:w.titleEn}/>:<><span>{String(i+2).padStart(2,"0")}</span><small>IMAGE / {w.year}</small></>}</div>
      <div className="work-meta"><span>{ru?w.titleRu:w.titleEn}</span><span>{w.year}</span></div>
    </Link>)}
   </div>
  </section>

  <section className="gallery-statement"><span>02—04</span><p>{ru?"Каждая работа — отдельный объект. Архив растёт постепенно.":"Each work exists as an independent object. The archive grows slowly."}</p><Link className="arrow-link" href={"/"+locale+"/about"}>{ru?"О студии":"About the studio"} <span>↗</span></Link></section>
 </main>
}

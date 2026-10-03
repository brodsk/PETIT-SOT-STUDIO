import Link from "next/link";
import {works} from "../../data/works";

export default async function Home({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params; const ru=locale==="ru";
  return <main className="gallery-home">
    <section className="hero-gallery">
      <div className="hero-top"><span>OLGA TRIKHLEB</span><span>{ru?"Художница":"Artist"} / {new Date().getFullYear()}</span></div>
      <div className="hero-title"><span>PETIT.SOT</span><em>STUDIO</em></div>
      <div className="hero-bottom">
        <p>{ru?"Живопись, исследования и визуальные фрагменты.":"Painting, studies and visual fragments."}</p>
        <Link className="arrow-link" href={"/"+locale+"/works"}>{ru?"Смотреть работы":"View works"} <span>↗</span></Link>
      </div>
    </section>
    <section className="gallery-intro">
      <div className="gallery-number">01 / {String(works.length).padStart(2,"0")}</div>
      <div className="hero-art art-placeholder"><span>01</span><small>{ru?"РАБОТА БУДЕТ ДОБАВЛЕНА":"ARTWORK TO BE ADDED"}</small></div>
      <div className="gallery-caption"><span>{works[0].title}</span><span>{works[0].year}</span><p>{ru?"Оригинальная работа Ольги Трихлеб.":"Original work by Olga Trikhleb."}</p></div>
    </section>
    <section className="gallery-pair">
      {works.slice(1,3).map((w,i)=><Link href={"/"+locale+"/works/"+w.slug} className={"gallery-piece piece-"+i} key={w.slug}>
        <div className="art-placeholder"><span>{String(i+2).padStart(2,"0")}</span><small>IMAGE / {w.year}</small></div>
        <div className="work-meta"><span>{w.title}</span><span>{w.year}</span></div>
      </Link>)}
    </section>
    <section className="gallery-statement">
      <span>02—04</span><p>{ru?"Каждая работа — отдельный объект. Архив растёт постепенно.":"Each work exists as an independent object. The archive grows slowly."}</p>
      <Link className="arrow-link" href={"/"+locale+"/about"}>{ru?"О студии":"About the studio"} <span>↗</span></Link>
    </section>
    <section className="gallery-footer-image">
      <div className="art-placeholder"><span>04</span><small>ARCHIVE / PETIT.SOT</small></div>
    </section>
  </main>
}
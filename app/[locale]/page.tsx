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
   <div className="hero-top"><span>OLGA TRIKHLEB</span><span>{ru?"Художница":"Artist"} / {new Date().getFullYear()}</span></div>

   <div className="hero-title-wrap">
    <div className="brush-signature" aria-label="PETIT.SOT STUDIO">
     <svg viewBox="0 0 1200 320" role="img" aria-hidden="true">
      <defs>
       <filter id="brush-soft">
        <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="2" seed="7" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8"/>
       </filter>
      </defs>
      <g className="brush-signature-word brush-signature-top" filter="url(#brush-soft)">
       {logoTop.map(([letter,x],i)=><text key={letter+"-"+i} x={x} y="142" style={{"--i":i} as Record<string, string | number>}>{letter}</text>)}
      </g>
      <g className="brush-signature-word brush-signature-bottom" filter="url(#brush-soft)">
       {logoBottom.map(([letter,x],i)=><text key={letter+"-"+i} x={x} y="282" style={{"--i":i+10} as Record<string, string | number>}>{letter}</text>)}
      </g>
     </svg>
    </div>

    <style>{`
      .brush-signature{position:relative;z-index:2;width:min(88vw,1180px);aspect-ratio:1200 / 320;height:auto;display:flex;align-items:center;justify-content:center}
      .brush-signature svg{width:100%;height:auto;display:block;overflow:visible}
      .brush-signature-word text{
        font-family:"Brush Script MT","Segoe Script","URW Chancery L",cursive;
        font-size:142px;
        font-style:italic;
        font-weight:500;
        fill:#171717;
        stroke:none;
        animation:signature-paint .9s cubic-bezier(.2,.8,.18,1) forwards;
        animation-delay:calc(var(--i) * .72s + .12s);
        clip-path:inset(0 100% 0 0);
        transform-origin:0 100%;
        filter:url(#brush-soft);
      }
      .brush-signature-top text:nth-last-child(1){animation-delay:1.05s}
      .brush-signature-bottom text{will-change:clip-path,transform,opacity}
      .brush-signature-top text,.brush-signature-bottom text{paint-order:stroke fill}
      .brush-signature-bottom text{font-size:126px}
      @keyframes signature-paint{
        0%{clip-path:inset(0 100% 0 0);opacity:.12;transform:translateX(-8px) scaleX(.72) rotate(-2deg)}
        18%{opacity:.82;transform:translateX(-2px) scaleX(.92) rotate(.5deg)}
        72%{opacity:1;transform:translateX(1px) scaleX(1.015) rotate(-.2deg)}
        100%{clip-path:inset(0 0 0 0);opacity:1;transform:translateX(0) scaleX(1) rotate(0)}
      }
      @media(prefers-reduced-motion:reduce){
        .brush-signature-word text{animation:none;stroke-dashoffset:0;fill:#171717}
      }
    `}</style>
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

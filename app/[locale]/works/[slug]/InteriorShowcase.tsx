"use client";

import {useEffect,useState} from "react";

type Interior = {image_url:string;style:string};

export default function InteriorShowcase({interiors,ru}:{interiors:Interior[];ru:boolean}){
 const [open,setOpen]=useState<number|null>(null);
 if(!interiors.length)return null;
 const labels:Record<string,string>={minimal:ru?"Минимализм / галерея":"Minimal / Gallery",modern:ru?"Современный интерьер":"Modern Apartment",warm:ru?"Тёплый интерьер":"Warm Interior",luxury:ru?"Премиальный интерьер":"Luxury"};
 const expanded=open===-1;

 useEffect(()=>{
  if(open===null||open===-1||interiors.length<2)return;
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==="ArrowLeft")setOpen(i=>i===null||i===-1?i:(i-1+interiors.length)%interiors.length);
   if(e.key==="ArrowRight")setOpen(i=>i===null||i===-1?i:(i+1)%interiors.length);
   if(e.key==="Escape")setOpen(-1);
  };
  window.addEventListener("keydown",onKey);
  return()=>window.removeEventListener("keydown",onKey);
 },[open,interiors.length]);

 const previous=()=>setOpen(i=>i===null||i===-1?i:(i-1+interiors.length)%interiors.length);
 const next=()=>setOpen(i=>i===null||i===-1?i:(i+1)%interiors.length);

 return <div className="work-interior-compact">
  <button type="button" className="interior-button" onClick={()=>setOpen(expanded?null:-1)}>
   <span>{ru?"Показать в интерьере":"View in interior"}</span><span className="interior-button-arrow">{expanded?"−":"+"}</span>
  </button>
  {expanded&&<div className="work-interior-thumbs">
   {interiors.map((item,i)=><button type="button" className="work-interior-thumb" onClick={()=>setOpen(i)} key={item.image_url+i}>
    <img src={item.image_url} alt={ru?"Картина в интерьере":"Artwork in an interior"}/><span>{labels[item.style]||item.style}</span>
   </button>)}
  </div>}
  {open!==null&&!expanded&&<div className="interior-lightbox" role="dialog" aria-modal="true" onClick={()=>setOpen(-1)}>
   <div className="interior-lightbox-inner" onClick={e=>e.stopPropagation()}>
    <button type="button" className="interior-lightbox-close" onClick={()=>setOpen(-1)} aria-label={ru?"Закрыть":"Close"}>×</button>
    {interiors.length>1&&<>
     <button type="button" className="interior-lightbox-nav interior-lightbox-prev" onClick={previous} aria-label={ru?"Предыдущая":"Previous"}>←</button>
     <button type="button" className="interior-lightbox-nav interior-lightbox-next" onClick={next} aria-label={ru?"Следующая":"Next"}>→</button>
    </>}
    <img src={interiors[open].image_url} alt={ru?"Картина в интерьере":"Artwork in an interior"}/>
    <div className="interior-lightbox-caption">{labels[interiors[open].style]||interiors[open].style}</div>
   </div>
  </div>}
 </div>;
}

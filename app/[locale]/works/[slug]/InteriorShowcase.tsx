"use client";

import {useState} from "react";

type Interior = {
  image_url:string;
  style:string;
};

export default function InteriorShowcase({interiors,ru}:{interiors:Interior[];ru:boolean}){
  const [active,setActive]=useState(0);
  if(!interiors.length)return null;

  const labels:Record<string,string> = {
    minimal:ru?"Минимализм / галерея":"Minimal / Gallery",
    modern:ru?"Современный интерьер":"Modern Apartment",
    warm:ru?"Тёплый интерьер":"Warm Interior",
    luxury:ru?"Премиальный интерьер":"Luxury",
  };

  return <section className="work-interior" id="interior">
    <div className="work-interior-head">
      <div>
        <p className="eyebrow">AI / INTERIOR</p>
        <h2>{ru?"В интерьере":"In an interior"}</h2>
      </div>
      <p>{ru?"Визуализация масштаба и атмосферы работы в пространстве.":"A visualisation of the work's scale and atmosphere in a space."}</p>
    </div>
    <div className="work-interior-main">
      <img src={interiors[active].image_url} alt={ru?"Картина в интерьере":"Artwork in an interior"} />
    </div>
    {interiors.length>1&&<div className="work-interior-thumbs">
      {interiors.map((item,i)=><button type="button" className={i===active?"active":""} onClick={()=>setActive(i)} key={item.image_url+i}>
        <img src={item.image_url} alt="" />
        <span>{labels[item.style]||item.style}</span>
      </button>)}
    </div>}
  </section>;
}

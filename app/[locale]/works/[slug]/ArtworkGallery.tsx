"use client";

import { useState } from "react";

export default function ArtworkGallery({images,alt}:{images:string[];alt:string}){
 const items=images.filter(Boolean);
 const [active,setActive]=useState(0);
 if(!items.length)return <div className="single-art"><span>IMAGE PLACEHOLDER</span><small>Original artwork image will be added</small></div>;
 return <div className="artwork-gallery">
  <div className="single-art"><img src={items[active]} alt={alt}/></div>
  {items.length>1&&<div className="artwork-gallery-thumbs" aria-label="Artwork photos">
   {items.map((src,index)=><button key={src+index} type="button" className={index===active?"active":""} onClick={()=>setActive(index)} aria-label={"Photo "+(index+1)}><img src={src} alt="" /></button>)}
  </div>}
 </div>;
}
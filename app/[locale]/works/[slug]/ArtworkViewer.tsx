"use client";
import {useEffect,useState} from "react";

export default function ArtworkViewer({images,alt}:{images:string[];alt:string}){
 const items=images.filter(Boolean), [active,setActive]=useState(0), [open,setOpen]=useState(false);
 useEffect(()=>{if(!open)return; const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false);if(e.key==="ArrowLeft")setActive(i=>(i-1+items.length)%items.length);if(e.key==="ArrowRight")setActive(i=>(i+1)%items.length)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[open,items.length]);
 if(!items.length)return <div className="single-art"><span>IMAGE PLACEHOLDER</span></div>;
 const prev=(e?:React.MouseEvent)=>{e?.stopPropagation();setActive(i=>(i-1+items.length)%items.length)};
 const next=(e?:React.MouseEvent)=>{e?.stopPropagation();setActive(i=>(i+1)%items.length)};
 return <div className="artwork-viewer">
  {items.length>1&&<div className="artwork-gallery-thumbs">{items.map((src,i)=><button type="button" className={i===active?"active":""} onClick={()=>setActive(i)} key={src+i}><img src={src} alt={alt+" — photo "+(i+1)}/></button>)}</div>}
  <div className="single-art artwork-viewer-main" onClick={()=>setOpen(true)}>
   <img src={items[active]} alt={alt}/>
   {items.length>1&&<>
    <button className="artwork-zone artwork-zone-left" onClick={prev} aria-label="Previous photo"/>
    <button className="artwork-zone artwork-zone-right" onClick={next} aria-label="Next photo"/>
    <span className="artwork-viewer-hint left">←</span><span className="artwork-viewer-hint right">→</span>
    <span className="artwork-gallery-count">{active+1} / {items.length}</span>
   </>}
  </div>
  {open&&<div className="artwork-lightbox" role="dialog" aria-modal="true" onClick={()=>setOpen(false)}>
   <button className="artwork-lightbox-close" onClick={()=>setOpen(false)} aria-label="Close">×</button>
   {items.length>1&&<button className="artwork-lightbox-arrow left" onClick={prev} aria-label="Previous photo">←</button>}
   <img src={items[active]} alt={alt} onClick={e=>e.stopPropagation()}/>
   {items.length>1&&<button className="artwork-lightbox-arrow right" onClick={next} aria-label="Next photo">→</button>}
   <span className="artwork-lightbox-count">{active+1} / {items.length}</span>
  </div>}
 </div>;
}

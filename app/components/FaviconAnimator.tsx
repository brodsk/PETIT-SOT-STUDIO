"use client";
import {useEffect} from "react";
export default function FaviconAnimator(){
 useEffect(()=>{
  const link=document.querySelector<HTMLLinkElement>('link[rel="icon"]')||document.createElement("link");
  link.rel="icon";document.head.appendChild(link);
  let last=0,frame=0;
  const draw=(now:number)=>{
   if(now-last>55){
    const t=frame/32, angle=-90+t*360, pulse=1+.08*Math.sin(t*Math.PI*2);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#f4f1eb"/><circle cx="32" cy="32" r="25" fill="none" stroke="#171717" stroke-opacity=".12"/><path d="M32 7a25 25 0 0 1 24 18" fill="none" stroke="#171717" stroke-width="3" stroke-linecap="round" transform="rotate(${angle} 32 32)"/><text x="32" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="25" font-weight="700" letter-spacing="-2" fill="#171717">PS</text><circle cx="50" cy="14" r="${2.1*pulse}" fill="#171717"/></svg>`;
    link.href="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);frame=(frame+1)%32;last=now;
   }
   requestAnimationFrame(draw);
  };
  const id=requestAnimationFrame(draw);return()=>cancelAnimationFrame(id);
 },[]);
 return null;
}

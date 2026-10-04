"use client";

import {useEffect} from "react";

export default function FaviconAnimator(){
  useEffect(()=>{
    let link=document.querySelector<HTMLLinkElement>('link[data-petit-sot-favicon]');
    if(!link){
      link=document.createElement("link");
      link.rel="icon";
      link.setAttribute("data-petit-sot-favicon","true");
      document.head.appendChild(link);
    }

    let raf=0;
    let last=0;
    let frame=0;
    const totalFrames=72;

    const draw=(now:number)=>{
      if(now-last>=45){
        const t=frame/totalFrames;
        const angle=-90+t*360;
        const pulse=1+0.07*Math.sin(t*Math.PI*2);
        const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="14" fill="#f4f1eb"/>
          <circle cx="32" cy="32" r="25" fill="none" stroke="#171717" stroke-opacity=".12"/>
          <path d="M32 7a25 25 0 0 1 24 18" fill="none" stroke="#171717" stroke-width="3" stroke-linecap="round" transform="rotate(${angle} 32 32)"/>
          <text x="32" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="25" font-weight="700" letter-spacing="-2" fill="#171717">PS</text>
          <circle cx="50" cy="14" r="${2.1*pulse}" fill="#171717"/>
        </svg>`;

        link!.href="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
        frame=(frame+1)%totalFrames;
        last=now;
      }
      raf=requestAnimationFrame(draw);
    };

    raf=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(raf);
  },[]);

  return null;
}

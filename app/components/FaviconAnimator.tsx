"use client";

import {useEffect} from "react";

export default function FaviconAnimator(){
  useEffect(()=>{
    /* Animated PNG favicon via Blob URLs; this avoids the browser caching every data-URI frame. */
    const link=document.createElement("link");
    link.rel="icon"; link.type="image/png";
    link.setAttribute("data-petit-sot-favicon","true");
    document.head.appendChild(link);
    const canvas=document.createElement("canvas");
    canvas.width=64; canvas.height=64;
    const ctx=canvas.getContext("2d");
    let frame=0, timer=0, previous="";
    const draw=()=>{
      if(!ctx)return;
      const t=frame/48;
      ctx.clearRect(0,0,64,64);
      ctx.fillStyle="#f4f1eb"; ctx.beginPath(); ctx.roundRect(0,0,64,64,14); ctx.fill();
      ctx.strokeStyle="rgba(23,23,23,.14)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(32,32,25,0,Math.PI*2); ctx.stroke();
      ctx.save(); ctx.translate(32,32); ctx.rotate(t*Math.PI*2);
      ctx.strokeStyle="#171717"; ctx.lineWidth=3; ctx.lineCap="round"; ctx.beginPath(); ctx.arc(0,0,25,-Math.PI/2,-Math.PI/6); ctx.stroke(); ctx.restore();
      ctx.fillStyle="#171717"; ctx.font="700 24px Georgia,serif"; ctx.textAlign="center"; ctx.fillText("PS",32,40);
      canvas.toBlob(blob=>{
        if(!blob)return;
        const url=URL.createObjectURL(blob);
        link.href=url;
        if(previous)URL.revokeObjectURL(previous);
        previous=url;
      },"image/png");
      frame=(frame+1)%48;
    };
    draw(); timer=window.setInterval(draw,90);

    return()=>{
      window.clearInterval(timer);
      if(previous)URL.revokeObjectURL(previous);
      link.remove();
    };
  },[]);
  return null;
}

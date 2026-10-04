"use client";

import {useEffect} from "react";

export default function FaviconAnimator(){
  useEffect(()=>{
    let link=document.querySelector<HTMLLinkElement>('link[data-petit-sot-favicon]');
    if(!link){
      link=document.createElement("link");
      link.rel="icon";
      link.type="image/png";
      link.setAttribute("data-petit-sot-favicon","true");
      document.head.appendChild(link);
    }

    const canvas=document.createElement("canvas");
    canvas.width=64; canvas.height=64;
    const ctx=canvas.getContext("2d");
    if(!ctx || !link) return;

    let raf=0;
    let last=0;
    let frame=0;
    const fps=20;
    const total=80;

    const draw=(now:number)=>{
      if(now-last>=1000/fps){
        const t=frame/total;
        ctx.clearRect(0,0,64,64);

        ctx.fillStyle="#f4f1eb";
        ctx.beginPath();
        ctx.roundRect(0,0,64,64,14);
        ctx.fill();

        ctx.strokeStyle="rgba(23,23,23,.12)";
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.arc(32,32,25,0,Math.PI*2);
        ctx.stroke();

        const angle=t*Math.PI*2-Math.PI/2;
        ctx.save();
        ctx.translate(32,32);
        ctx.rotate(angle);
        ctx.strokeStyle="#171717";
        ctx.lineWidth=3;
        ctx.lineCap="round";
        ctx.beginPath();
        ctx.arc(0,0,25,-Math.PI/2,-Math.PI/6);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle="#171717";
        ctx.font="700 25px Georgia, serif";
        ctx.textAlign="center";
        ctx.fillText("PS",32,40);

        const pulse=1+0.08*Math.sin(t*Math.PI*2);
        ctx.beginPath();
        ctx.arc(50,14,2.1*pulse,0,Math.PI*2);
        ctx.fill();

        link.href=canvas.toDataURL("image/png");
        frame=(frame+1)%total;
        last=now;
      }
      raf=requestAnimationFrame(draw);
    };

    raf=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(raf);
  },[]);

  return null;
}

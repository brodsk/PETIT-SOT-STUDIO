"use client";

import {useEffect} from "react";

export default function FaviconAnimator(){
  useEffect(()=>{
    const link=document.createElement("link");
    link.rel="icon"; link.type="image/png";
    link.setAttribute("data-petit-sot-favicon","true");
    document.head.appendChild(link);
    const canvas=document.createElement("canvas");
    canvas.width=48; canvas.height=48;
    const ctx=canvas.getContext("2d");
    let frame=0,timer=0,previous="",busy=false;
    const draw=()=>{
      if(!ctx||busy)return;
      busy=true;
      const t=frame/36;
      ctx.clearRect(0,0,48,48);
      ctx.fillStyle="#f4f1eb";ctx.beginPath();ctx.roundRect(0,0,48,48,10);ctx.fill();
      ctx.strokeStyle="rgba(23,23,23,.14)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(24,24,19,0,Math.PI*2);ctx.stroke();
      ctx.save();ctx.translate(24,24);ctx.rotate(t*Math.PI*2);
      ctx.strokeStyle="#171717";ctx.lineWidth=2.5;ctx.lineCap="round";ctx.beginPath();ctx.arc(0,0,19,-Math.PI/2,-Math.PI/6);ctx.stroke();ctx.restore();
      ctx.fillStyle="#171717";ctx.font="700 18px Georgia,serif";ctx.textAlign="center";ctx.fillText("PS",24,30);
      canvas.toBlob(blob=>{
        busy=false;
        if(!blob)return;
        const url=URL.createObjectURL(blob);
        link.href=url;
        if(previous)URL.revokeObjectURL(previous);
        previous=url;
      },"image/png");
      frame=(frame+1)%36;
    };
    draw();
    timer=window.setInterval(draw,140);
    return()=>{
      window.clearInterval(timer);
      if(previous)URL.revokeObjectURL(previous);
      link.remove();
    };
  },[]);
  return null;
}

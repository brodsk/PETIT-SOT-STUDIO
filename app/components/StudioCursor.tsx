"use client";
import {useEffect} from "react";

export default function StudioCursor(){
 useEffect(()=>{
  if(!window.matchMedia("(pointer:fine)").matches)return;
  const count=7;
  const dots=Array.from({length:count},()=>{
   const el=document.createElement("span");
   el.className="studio-cursor-dot";
   document.body.appendChild(el);
   return el;
  });
  const points=Array.from({length:count},()=>({x:-100,y:-100}));
  let targetX=-100,targetY=-100,raf=0,lastMove=0;
  const tick=(now:number)=>{
   raf=0;
   points[0].x+=(targetX-points[0].x)*.38;
   points[0].y+=(targetY-points[0].y)*.38;
   for(let i=1;i<count;i++){
    points[i].x+=(points[i-1].x-points[i].x)*.3;
    points[i].y+=(points[i-1].y-points[i].y)*.3;
   }
   dots.forEach((dot,i)=>{dot.style.transform=`translate3d(${points[i].x}px,${points[i].y}px,0)`;});
   const settled=Math.abs(points[0].x-targetX)<.15&&Math.abs(points[0].y-targetY)<.15&&points.every((p,i)=>i===0||Math.abs(p.x-points[i-1].x)<.15&&Math.abs(p.y-points[i-1].y)<.15);
   if(!settled||now-lastMove<120)raf=requestAnimationFrame(tick);
  };
  const move=(e:PointerEvent)=>{
   targetX=e.clientX; targetY=e.clientY; lastMove=performance.now();
   if(!raf)raf=requestAnimationFrame(tick);
  };
  window.addEventListener("pointermove",move,{passive:true});
  return()=>{
   window.removeEventListener("pointermove",move);
   if(raf)cancelAnimationFrame(raf);
   dots.forEach(dot=>dot.remove());
  };
 },[]);
 return null;
}

"use client";
import {useEffect} from "react";

export default function StudioCursor(){
 useEffect(()=>{
  if(!window.matchMedia("(pointer:fine)").matches)return;
  const count=7;
  const dots=Array.from({length:count},(_,i)=>{
   const el=document.createElement("span");
   el.className="studio-cursor-dot";
   el.dataset.index=String(i);
   document.body.appendChild(el);
   return el;
  });
  const points=Array.from({length:count},()=>({x:-100,y:-100}));
  let targetX=-100,targetY=-100,raf=0;
  const render=()=>{
   raf=0;
   points[0].x+=(targetX-points[0].x)*.34;
   points[0].y+=(targetY-points[0].y)*.34;
   for(let i=1;i<count;i++){
    points[i].x+=(points[i-1].x-points[i].x)*.28;
    points[i].y+=(points[i-1].y-points[i].y)*.28;
   }
   dots.forEach((dot,i)=>{
    dot.style.transform=`translate3d(${points[i].x}px,${points[i].y}px,0)`;
   });
   raf=requestAnimationFrame(render);
  };
  const move=(e:PointerEvent)=>{
   targetX=e.clientX;
   targetY=e.clientY;
   if(!raf)raf=requestAnimationFrame(render);
  };
  window.addEventListener("pointermove",move,{passive:true});
  raf=requestAnimationFrame(render);
  return()=>{
   window.removeEventListener("pointermove",move);
   if(raf)cancelAnimationFrame(raf);
   dots.forEach(dot=>dot.remove());
  };
 },[]);
 return null;
}

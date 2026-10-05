"use client";
import {useEffect} from "react";

export default function StudioCursor(){
 useEffect(()=>{
  if(!window.matchMedia("(pointer:fine)").matches)return;
  const el=document.createElement("div");
  el.className="studio-cursor";
  document.body.appendChild(el);
  let raf=0;
  let x=-100,y=-100;
  const render=()=>{
   raf=0;
   el.style.transform=`translate3d(${x}px,${y}px,0)`;
  };
  const move=(e:PointerEvent)=>{
   x=e.clientX;
   y=e.clientY;
   if(!raf)raf=requestAnimationFrame(render);
  };
  window.addEventListener("pointermove",move,{passive:true});
  return()=>{
   window.removeEventListener("pointermove",move);
   if(raf)cancelAnimationFrame(raf);
   el.remove();
  };
 },[]);
 return null;
}

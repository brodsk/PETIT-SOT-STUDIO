"use client";
import {useEffect} from "react";

export default function StudioCursor(){
 useEffect(()=>{
  if(window.matchMedia("(pointer:fine)").matches===false)return;
  const el=document.createElement("div");
  el.className="studio-cursor";
  document.body.appendChild(el);
  let x=-100,y=-100,tx=-100,ty=-100,raf=0;
  const move=(e:MouseEvent)=>{tx=e.clientX;ty=e.clientY};
  const tick=()=>{
   x+=(tx-x)*.22;y+=(ty-y)*.22;
   el.style.transform=`translate3d(${x}px,${y}px,0)`;
   raf=requestAnimationFrame(tick);
  };
  window.addEventListener("mousemove",move,{passive:true});
  raf=requestAnimationFrame(tick);
  return()=>{window.removeEventListener("mousemove",move);cancelAnimationFrame(raf);el.remove()};
 },[]);
 return null;
}

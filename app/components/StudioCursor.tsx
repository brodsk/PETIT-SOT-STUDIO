"use client";
import {useEffect} from "react";

export default function StudioCursor(){
 useEffect(()=>{
  if(!window.matchMedia("(pointer:fine)").matches)return;
  const el=document.createElement("div");
  el.className="studio-cursor";
  document.body.appendChild(el);
  let raf=0,moved=false;
  const move=(e:MouseEvent)=>{
    el.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0)`;
    el.classList.add("is-moving");
    moved=true;
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{moved=false;el.classList.remove("is-moving")});
  };
  window.addEventListener("mousemove",move,{passive:true});
  return()=>{window.removeEventListener("mousemove",move);cancelAnimationFrame(raf);el.remove()};
 },[]);
 return null;
}

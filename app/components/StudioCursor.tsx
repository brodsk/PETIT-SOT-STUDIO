"use client";

import {useEffect,useState} from "react";

export default function StudioCursor(){
 const [pos,setPos]=useState({x:-100,y:-100});
 const [link,setLink]=useState(false);
 useEffect(()=>{
  const move=(e:MouseEvent)=>{
   setPos({x:e.clientX,y:e.clientY});
   const el=e.target as Element|null;
   setLink(!!el?.closest("a,button,.archive-card,.gallery-piece,.work-card"));
  };
  window.addEventListener("mousemove",move,{passive:true});
  return()=>window.removeEventListener("mousemove",move);
 },[]);
 return <div className={"studio-cursor"+(link?" is-link":"")} style={{left:pos.x,top:pos.y}} aria-hidden="true">
  <svg viewBox="0 0 28 32" aria-hidden="true">
   <path className="cursor-stroke" d="M3 2.5 24.8 15 15.9 17.1 20.4 28.8 17.1 30 12.6 18.2 6.2 23.8Z"/>
   <path className="cursor-cut" d="M12.6 18.2 15.9 17.1"/>
  </svg>
 </div>;
}

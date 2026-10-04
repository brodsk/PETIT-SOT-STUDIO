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
  <svg viewBox="0 0 40 40" style={{transform:"rotate(180deg)"}}>
   <path className="brush-handle" d="M9 5h7l9 19-5 3L9 8z"/>
   <path className="brush-ferrule" d="M20 23l5-3 5 6-6 4z"/>
   <path className="brush-tip" d="M24 30l6-4 5 8-8-2z"/>
  </svg>
 </div>;
}

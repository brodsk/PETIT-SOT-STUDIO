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
  <span className="studio-cursor-ring"/>
  <span className="studio-cursor-dot"/>
  <span className="studio-cursor-line horizontal"/>
  <span className="studio-cursor-line vertical"/>
 </div>;
}

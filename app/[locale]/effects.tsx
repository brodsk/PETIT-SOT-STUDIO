"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

export default function Effects(){
  const pathname=usePathname();

  useEffect(()=>{
    const cursor=document.createElement("div");
    cursor.className="studio-cursor";
    cursor.innerHTML="<span></span>";
    document.body.appendChild(cursor);

    const move=(e:MouseEvent)=>{
      cursor.style.transform="translate3d("+e.clientX+"px,"+e.clientY+"px,0)";
    };
    const over=(e:Event)=>{
      const target=e.target as HTMLElement;
      if(target.closest("a,.archive-card,.gallery-piece,.work-card")) cursor.classList.add("is-link");
    };
    const out=(e:Event)=>{
      const target=e.target as HTMLElement;
      if(target.closest("a,.archive-card,.gallery-piece,.work-card")) cursor.classList.remove("is-link");
    };
    window.addEventListener("mousemove",move,{passive:true});
    document.addEventListener("mouseover",over);
    document.addEventListener("mouseout",out);

    const revealTargets=document.querySelectorAll<HTMLElement>(
      ".hero-top,.hero-title,.hero-bottom,.gallery-number,.hero-art,.gallery-caption,.gallery-piece,.gallery-statement,.gallery-footer-image,.archive-mast,.archive-card,.work-info,.single-art,.text-page h1,.text-columns,.contact-inner"
    );
    revealTargets.forEach((el,i)=>{
      el.classList.add("motion-reveal");
      el.style.setProperty("--reveal-delay",Math.min(i*45,450)+"ms");
    });
    requestAnimationFrame(()=>revealTargets.forEach(el=>el.classList.add("is-visible")));

    return()=>{
      window.removeEventListener("mousemove",move);
      document.removeEventListener("mouseover",over);
      document.removeEventListener("mouseout",out);
      cursor.remove();
    };
  },[pathname]);

  return null;
}

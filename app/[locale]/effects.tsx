"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

export default function Effects(){
  const pathname=usePathname();

  useEffect(()=>{
    const cursor=document.createElement("div");
    cursor.className="studio-cursor";
    cursor.innerHTML="<span class=\"studio-cursor-corner tl\"></span><span class=\"studio-cursor-corner tr\"></span><span class=\"studio-cursor-corner bl\"></span><span class=\"studio-cursor-corner br\"></span><span class=\"studio-cursor-center\"></span>";
    document.body.appendChild(cursor);

    const move=(e:MouseEvent)=>{
      cursor.style.left=e.clientX+"px";
      cursor.style.top=e.clientY+"px";
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

    const reveal=(el:Element)=>el.classList.add("is-visible");
    if("IntersectionObserver" in window){
      const observer=new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            reveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },{threshold:.12,rootMargin:"0px 0px -7% 0px"});
      revealTargets.forEach(el=>observer.observe(el));
      revealTargets.forEach((el)=>{if(el.getBoundingClientRect().top<window.innerHeight*.82) reveal(el);});
      return()=>{
        observer.disconnect();
        window.removeEventListener("mousemove",move);
        document.removeEventListener("mouseover",over);
        document.removeEventListener("mouseout",out);
        cursor.remove();
      };
    }

    revealTargets.forEach(reveal);
    return()=>{
      window.removeEventListener("mousemove",move);
      document.removeEventListener("mouseover",over);
      document.removeEventListener("mouseout",out);
      cursor.remove();
    };
  },[pathname]);

  return null;
}

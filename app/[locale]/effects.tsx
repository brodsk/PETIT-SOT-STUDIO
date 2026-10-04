"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

export default function Effects(){
  const pathname=usePathname();

  useEffect(()=>{
    // The visible pointer is deliberately rendered as a DOM cursor.
    // Inject this stylesheet last so older cursor:url()/pointer rules cannot win.
    const cursorStyle=document.createElement("style");
    cursorStyle.id="petit-sot-cursor-override";
    cursorStyle.textContent=`
      html,html *,body,body *{cursor:none!important}
      .studio-cursor{
        position:fixed!important;
        left:0!important;
        top:0!important;
        width:32px!important;
        height:32px!important;
        margin:0!important;
        padding:0!important;
        pointer-events:none!important;
        z-index:2147483647!important;
        opacity:1!important;
        display:block!important;
        transform:translate(-2px,-2px)!important;
      }
      .studio-cursor-brush{
        position:absolute!important;
        left:0!important;
        top:0!important;
        display:block!important;
        width:32px!important;
        height:32px!important;
        font-size:28px!important;
        line-height:32px!important;
        font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif!important;
        transform:rotate(-35deg)!important;
        transform-origin:20% 80%!important;
      }
    `;
    document.head.appendChild(cursorStyle);

    const cursor=document.createElement("div");
    cursor.className="studio-cursor";
    cursor.innerHTML="<span class=\"studio-cursor-brush\">🖌️</span>";
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
        cursorStyle.remove();
      };
    }

    revealTargets.forEach(reveal);
    return()=>{
      window.removeEventListener("mousemove",move);
      document.removeEventListener("mouseover",over);
      document.removeEventListener("mouseout",out);
      cursor.remove();
      cursorStyle.remove();
    };
  },[pathname]);

  return null;
}

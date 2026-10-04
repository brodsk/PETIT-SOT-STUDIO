"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

export default function Effects(){
  const pathname=usePathname();

  useEffect(()=>{
    // Minimal PETIT.SOT cursor: abstract pointer, no brush or emoji.
    const cursorStyle=document.createElement("style");
    cursorStyle.id="petit-sot-cursor-override";
    cursorStyle.textContent=`
      html,html *,body,body *{cursor:none!important}
      .studio-cursor{position:fixed!important;left:0!important;top:0!important;width:26px!important;height:26px!important;pointer-events:none!important;z-index:2147483647!important;opacity:0!important;display:block!important;transform:translate(-5px,-5px)!important;transition:opacity .16s ease}
      .studio-cursor.is-visible{opacity:1!important}
      .studio-cursor-shape{position:absolute;left:0;top:0;width:20px;height:20px;transform:rotate(45deg);transition:transform .24s cubic-bezier(.2,.8,.2,1)}
      .studio-cursor-shape:before{content:"";position:absolute;inset:1px;background:#171717;clip-path:polygon(0 0,100% 72%,62% 67%,48% 100%);transform:scale(.88);transform-origin:20% 20%}
      .studio-cursor-shape:after{content:"";position:absolute;width:4px;height:4px;left:3px;top:3px;background:#eeeae3;clip-path:polygon(0 0,100% 70%,65% 62%,48% 100%)}
      .studio-cursor-ring{position:absolute;left:-1px;top:-1px;width:22px;height:22px;border:1px solid rgba(23,23,23,.28);border-radius:50%;transform:scale(.45);opacity:0;transition:transform .28s cubic-bezier(.2,.8,.2,1),opacity .2s ease}
      .studio-cursor.is-link .studio-cursor-shape{transform:rotate(45deg) scale(.72)}
      .studio-cursor.is-link .studio-cursor-ring{transform:scale(1);opacity:1}
      .studio-cursor-dot{position:absolute;left:8px;top:8px;width:4px;height:4px;border-radius:50%;background:#171717;opacity:.7}
      .studio-cursor-trail{position:fixed;left:0;top:0;width:3px;height:3px;border-radius:50%;background:#171717;pointer-events:none;z-index:2147483646;opacity:0;transition:opacity .3s ease}
      @media(max-width:700px),(prefers-reduced-motion:reduce){.studio-cursor,.studio-cursor-trail{display:none!important}}
    `;
    document.head.appendChild(cursorStyle);

    const cursor=document.createElement("div");
    cursor.className="studio-cursor";
    cursor.innerHTML=`<span class="studio-cursor-shape"></span><span class="studio-cursor-ring"></span><span class="studio-cursor-dot"></span>`;
    document.body.appendChild(cursor);

    const trails=[1,2,3].map((n)=>{const el=document.createElement("span");el.className="studio-cursor-trail";document.body.appendChild(el);return el});
    let movingTimer:ReturnType<typeof setTimeout>|undefined;
    const move=(ev:MouseEvent)=>{
      const x=ev.clientX,y=ev.clientY;
      cursor.style.transform="translate("+(x-5)+"px,"+(y-5)+"px)";
      trails[0].style.transform="translate("+(x+8)+"px,"+(y+8)+"px)";
      trails[1].style.transform="translate("+(x+14)+"px,"+(y+14)+"px)";
      trails[2].style.transform="translate("+(x+20)+"px,"+(y+20)+"px)";
      trails.forEach((el,i)=>el.style.opacity=String(.18-i*.05));
      cursor.classList.add("is-visible");
      if(movingTimer)clearTimeout(movingTimer);
      movingTimer=setTimeout(()=>trails.forEach(el=>el.style.opacity="0"),70);
    };
    const over=(e:Event)=>{const target=e.target as HTMLElement;if(target.closest("a,.archive-card,.gallery-piece,.work-card,button"))cursor.classList.add("is-link")};
    const out=(e:Event)=>{const target=e.target as HTMLElement;if(target.closest("a,.archive-card,.gallery-piece,.work-card,button"))cursor.classList.remove("is-link")};
    const leave=()=>{cursor.classList.remove("is-visible","is-link");trails.forEach(el=>el.style.opacity="0")};
    window.addEventListener("mousemove",move,{passive:true});
    document.addEventListener("mouseover",over);
    document.addEventListener("mouseout",out);
    document.documentElement.addEventListener("mouseleave",leave);

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

"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

export default function Effects(){
  const pathname=usePathname();

  useEffect(()=>{
    // PETIT.SOT cursor — rebuilt from scratch: abstract point + orbit + ink-like motion trail.
    const cursorStyle=document.createElement("style");
    cursorStyle.id="petit-sot-cursor";
    cursorStyle.textContent=`
      html,html *,body,body *{cursor:none!important}
      .ps-cursor{position:fixed;left:0;top:0;width:28px;height:28px;pointer-events:none;z-index:2147483647;opacity:0;display:block;will-change:transform}
      .ps-cursor.visible{opacity:1}
      .ps-cursor-orbit{position:absolute;inset:1px;border:1px solid rgba(23,23,23,.48);border-radius:50%;transform:scale(.42);transition:transform .3s cubic-bezier(.22,1,.36,1),border-color .25s}
      .ps-cursor-core{position:absolute;left:10px;top:10px;width:8px;height:8px;background:#171717;border-radius:1px;transform:rotate(45deg);transition:transform .25s cubic-bezier(.22,1,.36,1),border-radius .25s}
      .ps-cursor-cross{position:absolute;left:13px;top:5px;width:2px;height:18px;background:#171717;opacity:.18;transform:scaleY(.45);transition:transform .3s,opacity .25s}
      .ps-cursor.cross-right .ps-cursor-cross{transform:scaleY(.45) rotate(90deg)}
      .ps-cursor.link .ps-cursor-orbit{transform:scale(1.05);border-color:rgba(23,23,23,.8)}
      .ps-cursor.link .ps-cursor-core{transform:rotate(45deg) scale(.72);border-radius:50%}
      .ps-cursor-trail{position:fixed;left:0;top:0;width:4px;height:4px;background:#171717;border-radius:50%;pointer-events:none;z-index:2147483646;opacity:0;will-change:transform,opacity}
      .ps-cursor-trail.t1{width:3px;height:3px;transition:transform .13s ease,opacity .22s ease}
      .ps-cursor-trail.t2{width:2px;height:2px;transition:transform .24s ease,opacity .32s ease}
      .ps-cursor-trail.t3{width:1px;height:1px;transition:transform .38s ease,opacity .45s ease}
      @media(max-width:700px),(prefers-reduced-motion:reduce){.ps-cursor,.ps-cursor-trail{display:none!important}}
    `;
    document.head.appendChild(cursorStyle);

    const cursor=document.createElement("div");
    cursor.className="ps-cursor";
    cursor.innerHTML=`<span class="ps-cursor-orbit"></span><span class="ps-cursor-core"></span><span class="ps-cursor-cross"></span>`;
    document.body.appendChild(cursor);

    const trails=[1,2,3].map(n=>{const el=document.createElement("span");el.className="ps-cursor-trail t"+n;document.body.appendChild(el);return el});
    let lastX=0,lastY=0,movingTimer:ReturnType<typeof setTimeout>|undefined;
    const move=(e:MouseEvent)=>{
      const x=e.clientX,y=e.clientY,dx=x-lastX,dy=y-lastY;
      lastX=x;lastY=y;
      cursor.style.transform=`translate(${x-14}px,${y-14}px)`;
      trails[0].style.transform=`translate(${x+6}px,${y+6}px)`;
      trails[1].style.transform=`translate(${x+12}px,${y+12}px)`;
      trails[2].style.transform=`translate(${x+19}px,${y+19}px)`;
      trails.forEach((el,i)=>el.style.opacity=String(Math.max(0,.2-i*.055)));
      cursor.classList.add("visible");
      if(Math.abs(dx)+Math.abs(dy)>2)cursor.classList.toggle("cross-right",(x+y)%2>1);
      if(movingTimer)clearTimeout(movingTimer);
      movingTimer=setTimeout(()=>trails.forEach(el=>el.style.opacity="0"),80);
    };
    const over=(e:Event)=>{
      const t=e.target as HTMLElement;
      if(t.closest("a,button,.archive-card,.gallery-piece,.work-card,.artwork-zone"))cursor.classList.add("link");
    };
    const out=(e:Event)=>{
      const t=e.target as HTMLElement;
      if(t.closest("a,button,.archive-card,.gallery-piece,.work-card,.artwork-zone"))cursor.classList.remove("link");
    };
    const leave=()=>{cursor.classList.remove("visible","link");trails.forEach(el=>el.style.opacity="0")};
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

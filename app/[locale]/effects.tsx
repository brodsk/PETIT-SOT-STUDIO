"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

export default function Effects(){
  const pathname=usePathname();

  useEffect(()=>{
    // Custom PETIT.SOT cursor: a minimal ink/brush pointer with a soft trail.
    const cursorStyle=document.createElement("style");
    cursorStyle.id="petit-sot-cursor-override";
    cursorStyle.textContent=`
      html,html *,body,body *{cursor:none!important}
      .studio-cursor{position:fixed!important;left:0!important;top:0!important;width:34px!important;height:34px!important;margin:0!important;padding:0!important;pointer-events:none!important;z-index:2147483647!important;opacity:0!important;display:block!important;transform:translate(-4px,-4px)!important;transition:opacity .18s ease!important}
      .studio-cursor.is-visible{opacity:1!important}
      .studio-cursor-core{position:absolute;inset:0;transform:rotate(-18deg);transform-origin:50% 50%}
      .studio-cursor-brush{position:absolute;left:4px;top:3px;width:28px;height:28px;display:block;transition:transform .22s cubic-bezier(.2,.8,.2,1)}
      .studio-cursor-brush svg{width:100%;height:100%;display:block;overflow:visible}
      .studio-cursor-ring{position:absolute;left:9px;top:9px;width:15px;height:15px;border:1px solid rgba(23,23,23,.7);border-radius:50%;transform:scale(.72);opacity:.7;transition:transform .28s cubic-bezier(.2,.8,.2,1),opacity .2s ease}
      .studio-cursor.is-link .studio-cursor-ring{transform:scale(1.65);opacity:.9}
      .studio-cursor.is-link .studio-cursor-brush{transform:scale(.82) rotate(-6deg);transform-origin:50% 50%}
      .studio-cursor-ink{position:absolute;left:12px;top:25px;width:3px;height:3px;border-radius:50%;background:#171717;opacity:0;transform:scale(.4);transition:opacity .2s ease,transform .2s ease}
      .studio-cursor.is-moving .studio-cursor-ink{opacity:.32;transform:scale(1)}
      .studio-cursor-trail{position:fixed;left:0;top:0;width:6px;height:6px;border-radius:50%;background:#171717;pointer-events:none;z-index:2147483646;opacity:0;mix-blend-mode:multiply}
      .studio-cursor-trail.t1{width:5px;height:5px;transition:transform .16s ease,opacity .25s ease}
      .studio-cursor-trail.t2{width:3px;height:3px;transition:transform .28s ease,opacity .3s ease}
      .studio-cursor-trail.t3{width:2px;height:2px;transition:transform .42s ease,opacity .4s ease}
      @media(max-width:700px),(prefers-reduced-motion:reduce){.studio-cursor,.studio-cursor-trail{display:none!important}}
    `;
    document.head.appendChild(cursorStyle);

    const cursor=document.createElement("div");
    cursor.className="studio-cursor";
    cursor.innerHTML=`<span class="studio-cursor-core">
      <span class="studio-cursor-brush" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none">
        <path d="M6 25.5 8.7 17 20.7 5c1.1-1.1 2.9-1.1 4 0l2.3 2.3c1.1 1.1 1.1 2.9 0 4L15 23.3 6 25.5Z" fill="#171717"/>
        <path d="m20.7 5 6.3 6.3M8.7 17l6.3 6.3" stroke="#eeeae3" stroke-width="1.1"/>
        <path d="M6 25.5 8.7 17l2.4 2.4-5.1 6.1Z" fill="#eeeae3" opacity=".9"/>
      </svg></span>
      <span class="studio-cursor-ring"></span>
      <span class="studio-cursor-ink"></span>
    </span>`;
    document.body.appendChild(cursor);

    const trails=[1,2,3].map((n)=>{
      const el=document.createElement("span");
      el.className="studio-cursor-trail t"+n;
      document.body.appendChild(el);
      return el;
    });
    let movingTimer:ReturnType<typeof setTimeout>|undefined;
    const move=(e:MouseEvent)=>{
      const x=e.clientX,y=e.clientY;
      cursor.style.transform="translate("+(x-4)+"px,"+(y-4)+"px)";
      trails[0].style.transform="translate("+(x-1)+"px,"+(y-1)+"px)";
      trails[1].style.transform="translate("+(x+4)+"px,"+(y+5)+"px)";
      trails[2].style.transform="translate("+(x+9)+"px,"+(y+11)+"px)";
      trails.forEach((el,i)=>{el.style.opacity=String(.24-i*.06)});
      cursor.classList.add("is-visible","is-moving");
      if(movingTimer) clearTimeout(movingTimer);
      movingTimer=setTimeout(()=>{cursor.classList.remove("is-moving");trails.forEach(el=>el.style.opacity="0")},90);
    };
    const over=(e:Event)=>{
      const target=e.target as HTMLElement;
      if(target.closest("a,.archive-card,.gallery-piece,.work-card,button")) cursor.classList.add("is-link");
    };
    const out=(e:Event)=>{
      const target=e.target as HTMLElement;
      if(target.closest("a,.archive-card,.gallery-piece,.work-card,button")) cursor.classList.remove("is-link");
    };
    const leave=()=>{cursor.classList.remove("is-visible","is-moving");trails.forEach(el=>el.style.opacity="0")};
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

"use client";

import {useEffect,useState} from "react";

export default function BackToTop(){
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    const onScroll=()=>setVisible(window.scrollY>320);
    onScroll();
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[]);

  const scrollTop=()=>{
    window.scrollTo({top:0,behavior:"smooth"});
  };

  return (
    <button
      type="button"
      className={"back-to-top"+(visible?" is-visible":"")}
      onClick={scrollTop}
      aria-label="Back to top"
      title="Back to top"
    >
      <span>↑</span>
    </button>
  );
}

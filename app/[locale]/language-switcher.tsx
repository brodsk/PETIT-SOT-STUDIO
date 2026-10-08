"use client";
import {usePathname} from "next/navigation";

export default function LanguageSwitcher({locale}:{locale:string}){
  const pathname=usePathname()||"/";
  const cleanPath=pathname.replace(/^\/(?:en|ru)(?=\/|$)/,"")||"/";
  const switchLanguage=(nextLocale:string)=>{
    document.cookie=`NEXT_LOCALE=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  };
  const label=(nextLocale:string)=>nextLocale.toUpperCase();
  return (
    <span className="language" aria-label="Language">
      <a href={cleanPath} onClick={()=>switchLanguage("en")} className={locale==="en"?"active":""}>{label("en")}</a>
      <i>/</i>
      <a href={cleanPath} onClick={()=>switchLanguage("ru")} className={locale==="ru"?"active":""}>{label("ru")}</a>
    </span>
  );
}
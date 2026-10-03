"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

export default function LanguageSwitcher({locale}:{locale:string}){
  const pathname=usePathname()||"/en";
  const target=(nextLocale:string)=>{
    const parts=pathname.split("/").filter(Boolean);
    if(parts.length===0)return "/"+nextLocale;
    parts[0]=nextLocale;
    return "/"+parts.join("/");
  };
  return <span className="language"><Link href={target("en")} className={locale==="en"?"active":""}>EN</Link><i>/</i><Link href={target("ru")} className={locale==="ru"?"active":""}>RU</Link></span>;
}
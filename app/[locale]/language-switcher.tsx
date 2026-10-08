"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";

export default function LanguageSwitcher({locale}:{locale:string}){
  const pathname=usePathname()||"/";
  const cleanPath=pathname.replace(/^\/(?:en|ru)(?=\/|$)/,"")||"/";
  const target=(nextLocale:string)=>nextLocale+(cleanPath==="/"?"":cleanPath);
  return <span className="language"><Link href={"/"+target("en")} className={locale==="en"?"active":""}>EN</Link><i>/</i><Link href={"/"+target("ru")} className={locale==="ru"?"active":""}>RU</Link></span>;
}

import Link from "next/link";
import {notFound} from "next/navigation";
import LanguageSwitcher from "./language-switcher";
import Effects from "./effects";

export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){
  const {locale}=await params;
  if(locale!=="en" && locale!=="ru") notFound();
  const ru=locale==="ru";
  return <div data-locale={locale}>
    <Effects />
    <header className="site-header">
      <Link href={"/"+locale} className="wordmark">PETIT.SOT <span className="wordmark-divider">|</span> <span>STUDIO</span></Link>
      <nav>
        <Link href={"/"+locale+"/works"}>{ru?"Работы":"Works"}</Link>
        <Link href={"/"+locale+"/about"}>{ru?"О студии":"About"}</Link>
        <Link href={"/"+locale+"/contact"}>{ru?"Контакты":"Contact"}</Link>
        <LanguageSwitcher locale={locale}/>
      </nav>
    </header>
    {children}
    <footer><span>© {new Date().getFullYear()} PETIT.SOT STUDIO</span><span>Olga Trikhleb</span><a href="https://www.instagram.com/petit.sot/" target="_blank" rel="noreferrer">Instagram ↗</a></footer>
  </div>
}

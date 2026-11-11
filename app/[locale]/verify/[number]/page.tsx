import type { Metadata } from "next";
import { createClient } from "../../../../lib/supabase/server";
import { localizeMedium } from "../../../../lib/medium";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({params}:{params:Promise<{locale:string;number:string}>}):Promise<Metadata>{
 const {number}=await params;
 return {
  title:"Certificate Verification | PETIT.SOT STUDIO",
  description:"Verify the authenticity certificate issued by PETIT.SOT STUDIO.",
  robots:{index:false,follow:false},
  alternates:{canonical:`${SITE_URL}/verify/${encodeURIComponent(number)}`}
 };
}

export default async function VerifyCertificatePage({params}:{params:Promise<{locale:string;number:string}>}){
 const {locale,number}=await params;
 const ru=locale==="ru";
 const supabase=await createClient();
 const {data:work,error}=await supabase
  .from("petit_sot_artworks")
  .select("title,title_en,year,medium,width_cm,height_cm,certificate_number,image_path,slug")
  .eq("certificate_number",number)
  .maybeSingle();

 const imageUrl=work?.image_path
  ? supabase.storage.from("petit-sot-artworks").getPublicUrl(work.image_path).data.publicUrl
  : null;
 const title=work ? (work.title_en||work.title||"Untitled") : "";

 return <main className="certificate-verify-page">
  <div className="certificate-verify-shell">
   <header className="certificate-verify-header">
    <span>PETIT.SOT <i>|</i> STUDIO</span>
    <span>{ru?"ПРОВЕРКА СЕРТИФИКАТА":"CERTIFICATE VERIFICATION"}</span>
   </header>
   {error ? <section className="certificate-verify-result">
    <span className="certificate-verify-mark certificate-verify-mark-error">!</span>
    <p className="eyebrow">{ru?"ПРОВЕРКА ВРЕМЕННО НЕДОСТУПНА":"VERIFICATION TEMPORARILY UNAVAILABLE"}</p>
    <h1>{ru?"Не удалось проверить сертификат":"Unable to verify certificate"}</h1>
    <p>{ru?"Пожалуйста, попробуйте ещё раз позже.":"Please try again later. The verification service could not be reached."}</p>
   </section> : work ? <section className="certificate-verify-result">
    <span className="certificate-verify-mark">✓</span>
    <p className="eyebrow">{ru?"СЕРТИФИКАТ НАЙДЕН В БАЗЕ":"CERTIFICATE FOUND IN OFFICIAL RECORDS"}</p>
    <h1>{ru?"Подлинность подтверждена":"Authenticity confirmed"}</h1>
    <p className="certificate-verify-intro">{ru?"Этот номер сертификата зарегистрирован в базе PETIT.SOT STUDIO. Сведения ниже соответствуют записи о произведении.":"This certificate number is registered in the PETIT.SOT STUDIO records. The artwork details below match the registered record."}</p>
    <div className="certificate-verify-artwork">
     {imageUrl ? <img src={imageUrl} alt={title}/> : <div className="certificate-verify-no-image">PETIT.SOT</div>}
     <div className="certificate-verify-details">
      <span className="eyebrow">{ru?"ХУДОЖНИК":"ARTIST"}</span>
      <p className="certificate-verify-artist">Olga Trikhleb</p>
      <span className="eyebrow">{ru?"НАЗВАНИЕ":"TITLE"}</span>
      <h2>{title}</h2>
      <dl>
       <div><dt>{ru?"ГОД":"YEAR"}</dt><dd>{work.year||"—"}</dd></div>
       <div><dt>{ru?"МАТЕРИАЛ":"MEDIUM"}</dt><dd>{localizeMedium(work.medium,"en")}</dd></div>
       <div><dt>{ru?"РАЗМЕР":"DIMENSIONS"}</dt><dd>{work.width_cm&&work.height_cm?`${work.width_cm} × ${work.height_cm} cm`:"—"}</dd></div>
       <div><dt>{ru?"НОМЕР СЕРТИФИКАТА":"CERTIFICATE NO."}</dt><dd>{work.certificate_number}</dd></div>
      </dl>
     </div>
    </div>
    <p className="certificate-verify-note">{ru?"Подтверждение означает, что номер сертификата существует в официальной базе PETIT.SOT STUDIO.":"This confirms that the certificate number exists in the official PETIT.SOT STUDIO records. It does not by itself establish ownership or transfer of copyright."}</p>
   </section> : <section className="certificate-verify-result">
    <span className="certificate-verify-mark certificate-verify-mark-error">×</span>
    <p className="eyebrow">{ru?"СЕРТИФИКАТ НЕ НАЙДЕН":"NO MATCHING RECORD"}</p>
    <h1>{ru?"Сертификат не подтверждён":"Certificate not verified"}</h1>
    <p>{ru?"Такой номер не найден в базе PETIT.SOT STUDIO. Проверьте номер и свяжитесь со студией, если считаете, что это ошибка.":"This certificate number could not be found in the PETIT.SOT STUDIO records. Check the number and contact the studio if you believe this is an error."}</p>
   </section>}
   <footer className="certificate-verify-footer">
    <a href="https://www.petitsot.com">{ru?"ОФИЦИАЛЬНЫЙ САЙТ":"OFFICIAL WEBSITE"} ↗</a>
    <span>© {new Date().getFullYear()} PETIT.SOT STUDIO</span>
   </footer>
  </div>
 </main>;
}

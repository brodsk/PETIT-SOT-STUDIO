import {notFound} from "next/navigation";
import {getWork,localizeMedium} from "../../../../lib/works";
import {createClient} from "../../../../lib/supabase/server";
import Link from "next/link";
import ArtworkViewer from "./ArtworkViewer";
import InteriorShowcase from "./InteriorShowcase";

export default async function WorkPage({params}:{params:Promise<{locale:string;slug:string}>}){
 const {locale,slug}=await params;
 const ru=locale==="ru";
 const w=await getWork(slug);
 if(!w)notFound();

 let interiors:{image_url:string;style:string}[]=[];
 if(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY&&w.id){
  try{
   const supabase=await createClient();
   const {data}=await supabase.from("petit_sot_artwork_interiors").select("image_path,style,created_at").eq("artwork_id",w.id).order("created_at",{ascending:false});
   interiors=(data||[]).map(item=>({
    image_url:supabase.storage.from("petit-sot-artworks").getPublicUrl(item.image_path).data.publicUrl,
    style:item.style,
   }));
  }catch{}
 }

 return <main className="work-page">
  <Link href={"/"+locale+"/works"} className="back">← {ru?"Архив":"Archive"}</Link>
  <ArtworkViewer images={w.images.length?w.images:(w.imageUrl?[w.imageUrl]:[])} alt={ru?w.titleRu:w.titleEn}/>
  <aside className="work-info">
   <p className="eyebrow">PETIT.SOT / {w.year}</p>
   <h1>{ru?w.titleRu:w.titleEn}</h1>
   <dl>
    <div><dt>{ru?"Материал":"Medium"}</dt><dd>{localizeMedium(w.medium,ru?"ru":"en")}</dd></div>
    <div><dt>{ru?"Размер":"Size"}</dt><dd>{w.size}</dd></div>
    <div><dt>{ru?"Год":"Year"}</dt><dd>{w.year}</dd></div>
   </dl>
   <p className="work-description">{ru?w.descriptionRu:w.descriptionEn}</p>
   <div className="purchase-box">{w.available?<><div><span className="purchase-label">{ru?"Доступна":"Available"}</span><strong>{w.price>0?new Intl.NumberFormat(ru?"ru-RU":"en-GB",{style:"currency",currency:w.currency}).format(w.price):(ru?"Цена по запросу":"Price on request")}</strong></div><Link className="purchase-button" href={"/"+locale+"/contact?work="+encodeURIComponent(ru?w.titleRu:w.titleEn)}>{ru?"Приобрести работу":"Acquire this work"} <span>↗</span></Link><p>{ru?"Безопасная оплата через Stripe появится здесь. Пока отправьте запрос на приобретение.":"Secure online payment via Stripe will be available here. For now, send a purchase enquiry."}</p></>:<><span className="purchase-label">{ru?"Статус":"Status"}</span><strong>{ru?"Продано / недоступно":"Sold / unavailable"}</strong></>}</div>
  </aside>
  <InteriorShowcase interiors={interiors} ru={ru}/>
 </main>
}

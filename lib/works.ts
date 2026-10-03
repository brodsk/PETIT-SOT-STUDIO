import { createClient } from "./supabase/server";
import { localizeMedium } from "./medium";

export type PublicWork={slug:string;title:string;titleRu:string;titleEn:string;year:string;medium:string;size:string;description:string;descriptionRu:string;descriptionEn:string;price:number;currency:string;available:boolean;imageUrl?:string;id?:string};

export const fallbackWorks:PublicWork[]=[];

function mapWork(w:any,supabase:any):PublicWork{
 const size=[w.width_cm,w.height_cm,w.depth_cm].filter((x:any)=>x!=null&&x!=="").join(" × ");
 const imageUrl=w.image_path?supabase.storage.from("petit-sot-artworks").getPublicUrl(w.image_path).data.publicUrl:undefined;
 return {id:w.id,slug:w.slug,title:w.title,titleRu:w.title,titleEn:w.title_en||w.title,year:String(w.year??"—"),medium:w.medium||"—",size:size?size+" cm":"—",description:w.description||w.ai_description||"",descriptionRu:w.description||"",descriptionEn:w.description_en||w.ai_description||w.description||"",price:Number(w.price_eur||0),currency:"EUR",available:w.status==="available",imageUrl};
}

export async function getWorks():Promise<PublicWork[]>{
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return fallbackWorks;
 try{
   const supabase=await createClient();
   const {data,error}=await supabase.from("petit_sot_artworks").select("*").in("status",["available","sold"]).order("created_at",{ascending:false});
   if(error)return fallbackWorks;
   if(!data||data.length===0)return [];
   return data.map(w=>mapWork(w,supabase));
 }catch{return fallbackWorks;}
}

export async function getWork(slug:string){
 const works=await getWorks();
 return works.find(w=>w.slug===slug)||null;
}

export { localizeMedium };

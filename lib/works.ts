import { createClient } from "./supabase/server";
import { localizeMedium } from "./medium";

export type PublicWork={slug:string;title:string;year:string;medium:string;size:string;description:string;descriptionRu:string;descriptionEn:string;price:number;currency:string;available:boolean;imageUrl?:string;id?:string};

export const fallbackWorks:PublicWork[]=[
 {slug:"untitled-i",title:"Untitled I",year:"2024",medium:"Oil on canvas",size:"—",price:0,currency:"EUR",available:true,description:"Work archive entry. Original artwork image will replace this temporary presentation."},
 {slug:"untitled-ii",title:"Untitled II",year:"2024",medium:"Mixed media on canvas",size:"—",price:0,currency:"EUR",available:true,description:"Work archive entry. Original artwork image will replace this temporary presentation."},
 {slug:"untitled-iii",title:"Untitled III",year:"2025",medium:"Oil on canvas",size:"—",price:0,currency:"EUR",available:false,description:"Work archive entry. Original artwork image will replace this temporary presentation."},
 {slug:"untitled-iv",title:"Untitled IV",year:"2025",medium:"Acrylic on canvas",size:"—",price:0,currency:"EUR",available:true,description:"Work archive entry. Original artwork image will replace this temporary presentation."}
];

function mapWork(w:any,supabase:any):PublicWork{
 const size=[w.width_cm,w.height_cm,w.depth_cm].filter((x:any)=>x!=null&&x!=="").join(" × ");
 const imageUrl=w.image_path?supabase.storage.from("petit-sot-artworks").getPublicUrl(w.image_path).data.publicUrl:undefined;
 return {id:w.id,slug:w.slug,title:w.title,year:String(w.year??"—"),medium:w.medium||"—",size:size?size+" cm":"—",description:w.description||w.ai_description||"",descriptionRu:w.description||"",descriptionEn:w.ai_description||w.description||"",price:Number(w.price_eur||0),currency:"EUR",available:w.status==="available",imageUrl};
}

export async function getWorks():Promise<PublicWork[]>{
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return fallbackWorks;
 try{
   const supabase=await createClient();
   const {data,error}=await supabase.from("petit_sot_artworks").select("*").in("status",["available","sold"]).order("created_at",{ascending:false});
   if(error||!data||data.length===0)return fallbackWorks;
   return data.map(w=>mapWork(w,supabase));
 }catch{return fallbackWorks;}
}

export async function getWork(slug:string){
 const works=await getWorks();
 return works.find(w=>w.slug===slug)||null;
}

export { localizeMedium };

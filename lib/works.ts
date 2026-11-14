import { createClient } from "./supabase/server";
import { localizeMedium } from "./medium";

export type PublicWork={slug:string;title:string;titleRu:string;titleEn:string;year:string;medium:string;size:string;widthCm?:number;heightCm?:number;depthCm?:number;description:string;descriptionRu:string;descriptionEn:string;price:number;currency:string;status:string;available:boolean;sold:boolean;imageUrl?:string;thumbnailUrl?:string;images:string[];thumbnailImages:string[];id?:string;etsyListingUrl?:string|null;sasheListingUrl?:string|null};

export const fallbackWorks:PublicWork[]=[];

const SASHE_LISTINGS: Record<string,string> = {
  "meadow": "https://www.sashe.sk/petitsot/detail/originalny-olejomalovany-obraz-meadow-horska-luka-s-ovcami",
  "sunset": "https://www.sashe.sk/petitsot/detail/originalny-olejomalovany-obraz-sunset-in-the-village-zapad-slnka-na-dedine",
  "sunset-in-the-village": "https://www.sashe.sk/petitsot/detail/originalny-olejomalovany-obraz-sunset-in-the-village-zapad-slnka-na-dedine",
  "evening": "https://www.sashe.sk/petitsot/detail/originalny-olejomalovany-obraz-evening-vecerna-krajina",
  "nice": "https://www.sashe.sk/petitsot/detail/originalny-olejomalovany-obraz-nice-pohlad-na-more",
  "angel": "https://www.sashe.sk/petitsot/detail/originalny-olejomalovany-obraz-angel-padly-anjel",
  "road": "https://www.sashe.sk/petitsot/detail/originalny-olejomalovany-obraz-road-krajinny-motiv",
  "fog": "https://www.sashe.sk/petitsot/detail/originalny-olejomalovany-obraz-fog-krajina-v-hmle",
  "rain-in-the-city": "https://www.sashe.sk/petitsot/detail/originalny-olejomalovany-obraz-rain-in-the-city-mestsky-motiv",
  "rain": "https://www.sashe.sk/petitsot/detail/originalny-olejomalovany-obraz-rain-in-the-city-mestsky-motiv",
};

function mapWork(w:any,supabase:any,extraImages:string[]=[],extraThumbnails:string[]=[]):PublicWork{
 const size=[w.width_cm,w.height_cm,w.depth_cm].filter((x:any)=>x!=null&&x!=="").join(" × ");
 const imageUrl=(w.web_image_path||w.image_path)?supabase.storage.from("petit-sot-artworks").getPublicUrl(w.web_image_path||w.image_path).data.publicUrl:undefined;\n const thumbnailUrl=(w.thumbnail_path||w.web_image_path||w.image_path)?supabase.storage.from("petit-sot-artworks").getPublicUrl(w.thumbnail_path||w.web_image_path||w.image_path).data.publicUrl:undefined;
 const slug=String(w.slug||"").toLowerCase();
 const sasheListingUrl=SASHE_LISTINGS[slug] || SASHE_LISTINGS[slug.replace(/_/g,"-")] || null;
 const titleEn=String(w.title_en||w.title||"").trim().replaceAll("Olya Trikhleb","Olga Trikhleb").replaceAll("Olga Trihleb","Olga Trikhleb");
 const descriptionEn=String(w.description_en||w.ai_description||w.description||"").replaceAll("Olya Trikhleb","Olga Trikhleb").replaceAll("Olga Trihleb","Olga Trikhleb");
 return {id:w.id,slug:w.slug,title:w.title,titleRu:w.title,titleEn,year:String(w.year??"—"),medium:w.medium||"—",size:size?size+" cm":"—",widthCm:w.width_cm!=null?Number(w.width_cm):undefined,heightCm:w.height_cm!=null?Number(w.height_cm):undefined,depthCm:w.depth_cm!=null?Number(w.depth_cm):undefined,description:w.description||w.ai_description||"",descriptionRu:w.description||"",descriptionEn,price:Number(w.price_eur||0),currency:"EUR",status:String(w.status||"archived"),available:w.status==="available",sold:w.status==="sold",imageUrl,thumbnailUrl,images:imageUrl?[imageUrl,...extraImages]:extraImages,thumbnailImages:thumbnailUrl?[thumbnailUrl,...(extraThumbnails.length?extraThumbnails:extraImages)]:extraThumbnails,etsyListingUrl:w.etsy_listing_url||null,sasheListingUrl};
}

export async function getWorks():Promise<PublicWork[]>{
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return fallbackWorks;
 try{
   const supabase=await createClient();
   const {data,error}=await supabase.from("petit_sot_artworks").select("*").in("status",["available","sold","archived"]).order("created_at",{ascending:false});
   if(error)return fallbackWorks;
   if(!data||data.length===0)return [];
   const ids=data.map((w:any)=>w.id);
   const {data:gallery}=await supabase.from("petit_sot_artwork_images").select("artwork_id,image_path,web_image_path,thumbnail_path,sort_order").in("artwork_id",ids).order("sort_order",{ascending:true});
   const byArtwork=new Map<string,string[]>();
   for(const item of gallery||[]){
    const url=supabase.storage.from("petit-sot-artworks").getPublicUrl(item.image_path).data.publicUrl;
    const list=byArtwork.get(item.artwork_id)||[]; list.push(url); byArtwork.set(item.artwork_id,list);
   }
   return data.map(w=>mapWork(w,supabase,byArtwork.get(w.id)||[]));
 }catch{return fallbackWorks;}
}

export async function getWork(slug:string){
 const works=await getWorks();
 return works.find(w=>w.slug===slug)||null;
}

export { localizeMedium };

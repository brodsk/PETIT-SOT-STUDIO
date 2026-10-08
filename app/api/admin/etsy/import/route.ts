import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { etsyRequest } from "../../../../../lib/etsy";

function fail(message:string,status=400){return NextResponse.json({ok:false,error:message},{status});}

async function json(response:Response){
  const text=await response.text();
  try{return JSON.parse(text)}catch{return {error:text.slice(0,1200)}}
}

function etsyError(payload:any,fallback:string){
  if(typeof payload==="string"&&payload.trim())return payload.trim().slice(0,1200);
  const candidates=[
    payload?.error_description,
    typeof payload?.error==="string"?payload.error:payload?.error?.message,
    payload?.message,
    payload?.detail,
    payload?.title,
  ].filter((value:any)=>typeof value==="string"&&value.trim());
  if(candidates.length)return candidates[0].trim().slice(0,1200);
  if(Array.isArray(payload?.errors)&&payload.errors.length){
    const details=payload.errors.map((item:any)=>typeof item==="string"?item:item?.message||item?.error||item?.code||JSON.stringify(item)).filter(Boolean);
    if(details.length)return details.join("; ").slice(0,1200);
  }
  if(payload&&typeof payload==="object"&&Object.keys(payload).length){
    try{return JSON.stringify(payload).slice(0,1200)}catch{}
  }
  return fallback;
}

function whenMade(year:number|null){
  if(!year||year>=2020)return "2020_2026";
  if(year>=2010)return "2010_2019";
  if(year>=2007)return "2007_2009";
  if(year>=2000)return "2000_2006";
  if(year>=1990)return "1990s";
  if(year>=1980)return "1980s";
  if(year>=1970)return "1970s";
  if(year>=1960)return "1960s";
  if(year>=1950)return "1950s";
  if(year>=1940)return "1940s";
  if(year>=1930)return "1930s";
  if(year>=1920)return "1920s";
  if(year>=1910)return "1910s";
  if(year>=1900)return "1900s";
  return "before_1700";
}

function findPainting(nodes:any[]):any|null{
  let fallback:any=null;
  function walk(items:any[]):any|null{
    for(const node of items||[]){
      const name=String(node?.name||"").toLowerCase();
      if(name==="paintings"||name==="painting")return node;
      if(!fallback && ["fine art","wall art","art"].includes(name))fallback=node;
      const found=walk(node?.children||[]);
      if(found)return found;
    }
    return null;
  }
  return walk(nodes)||fallback;
}

export async function POST(request:Request){
  const {supabase}=await requireAdmin();
  const body=await request.json().catch(()=>({}));
  const artworkId=String(body?.artworkId||"");
  if(!artworkId)return fail("Не указана картина.");

  const {data:artwork,error:artworkError}=await supabase.from("petit_sot_artworks")
    .select("id,title,title_en,year,medium,width_cm,height_cm,depth_cm,description,description_en,price_eur,image_path,etsy_listing_id")
    .eq("id",artworkId).single();
  if(artworkError||!artwork)return fail("Картина не найдена.",404);
  if(artwork.etsy_listing_id)return NextResponse.json({ok:true,skipped:true,listingId:artwork.etsy_listing_id});

  try{
    const {data:connection,error:connectionError}=await supabase.from("petit_sot_etsy_connections").select("etsy_shop_id").eq("id",1).maybeSingle();
    if(connectionError)throw connectionError;
    const shopId=Number(connection?.etsy_shop_id||0);
    if(!shopId)throw new Error("Etsy-магазин не подключён. Переподключите Etsy после обновления разрешений.");

    const shippingResponse=await etsyRequest("/application/shops/"+shopId+"/shipping-profiles");
    const shipping=await json(shippingResponse);
    if(!shippingResponse.ok)throw new Error(etsyError(shipping,"Не удалось получить shipping profiles Etsy."));
    const shippingProfile=shipping?.results?.find((x:any)=>!x.is_deleted)||shipping?.results?.[0];
    if(!shippingProfile?.shipping_profile_id)throw new Error("В Etsy нет shipping profile. Создайте профиль доставки в Shop Manager.");

    const readinessResponse=await etsyRequest("/application/shops/"+shopId+"/readiness-state-definitions?limit=100");
    const readiness=await json(readinessResponse);
    if(!readinessResponse.ok)throw new Error(etsyError(readiness,"Не удалось получить processing profiles Etsy."));
    const readinessProfile=readiness?.results?.find((x:any)=>x.readiness_state==="ready_to_ship")||readiness?.results?.[0];
    if(!readinessProfile?.readiness_state_id)throw new Error("В Etsy нет processing profile. Создайте профиль обработки заказа.");

    let taxonomyId=Number(process.env.ETSY_TAXONOMY_ID||0);
    if(!taxonomyId){
      const taxonomyResponse=await etsyRequest("/application/seller-taxonomy/nodes");
      const taxonomy=await json(taxonomyResponse);
      if(!taxonomyResponse.ok)throw new Error(etsyError(taxonomy,"Не удалось получить категории Etsy."));
      taxonomyId=Number(findPainting(taxonomy?.results||[])?.id||0);
    }
    if(!taxonomyId)throw new Error("Не удалось определить категорию Paintings в Etsy.");

    const title=String(artwork.title_en||artwork.title||"Untitled").slice(0,140);
    const description=[
      artwork.description_en||artwork.description||"",
      artwork.medium?"Medium: "+artwork.medium:"",
      artwork.year?"Year: "+artwork.year:"",
      artwork.width_cm&&artwork.height_cm?"Dimensions: "+artwork.width_cm+" × "+artwork.height_cm+(artwork.depth_cm?" × "+artwork.depth_cm:"")+" cm":""
    ].filter(Boolean).join("\n\n");

    const form=new URLSearchParams();
    form.set("quantity","1");
    form.set("title",title);
    form.set("description",description);
    form.set("price",String(Math.max(0.01,Number(artwork.price_eur)||0)));
    form.set("who_made","i_did");
    form.set("when_made",whenMade(artwork.year));
    form.set("is_supply","false");
    form.set("taxonomy_id",String(taxonomyId));
    form.set("shipping_profile_id",String(shippingProfile.shipping_profile_id));
    form.set("readiness_state_id",String(readinessProfile.readiness_state_id));
    form.set("processing_min",String(readinessProfile.min_processing_days||1));
    form.set("processing_max",String(readinessProfile.max_processing_days||3));
    for(const tag of ["original art","contemporary art","wall art","abstract painting"])form.append("tags",tag);
    if(artwork.medium)form.append("materials",String(artwork.medium).replace(/[^\p{L}\p{Nd}\p{Zs}]/gu," ").replace(/\s+/g," ").trim().slice(0,45));

    const createResponse=await etsyRequest("/application/shops/"+shopId+"/listings?legacy=false",{method:"POST",body:form});
    const created=await json(createResponse);
    if(!createResponse.ok)throw new Error("Создание объявления: "+etsyError(created,"Etsy не создал черновик."));
    const listingId=Number(created?.listing_id||0);
    if(!listingId)throw new Error("Etsy ответил без listing_id: "+etsyError(created,"пустой ответ API."));

    const listingUrl="https://www.etsy.com/listing/"+listingId;
    const {error:createdSaveError}=await supabase.from("petit_sot_artworks").update({
      etsy_listing_id:listingId,etsy_state:"draft",etsy_error:null,etsy_listing_url:listingUrl,etsy_synced_at:new Date().toISOString()
    }).eq("id",artwork.id);
    if(createdSaveError)throw new Error("Etsy создал объявление #"+listingId+", но не удалось сохранить его ID на сайте: "+createdSaveError.message);

    const paths:string[]=[];
    if(artwork.image_path)paths.push(artwork.image_path);
    const {data:gallery,error:galleryError}=await supabase.from("petit_sot_artwork_images").select("image_path,sort_order").eq("artwork_id",artwork.id).order("sort_order",{ascending:true});
    if(galleryError)throw galleryError;
    for(const row of gallery||[])if(row.image_path&&!paths.includes(row.image_path))paths.push(row.image_path);

    for(let i=0;i<paths.length;i++){
      const publicUrl=supabase.storage.from("petit-sot-artworks").getPublicUrl(paths[i]).data.publicUrl;
      const imageResponse=await fetch(publicUrl,{cache:"no-store"});
      if(!imageResponse.ok)throw new Error("Не удалось прочитать изображение картины.");
      const buffer=await imageResponse.arrayBuffer();
      const uploadForm=new FormData();
      uploadForm.append("image",new Blob([buffer],{type:imageResponse.headers.get("content-type")||"image/jpeg"}),paths[i].split("/").pop()||("artwork-"+(i+1)+".jpg"));
      uploadForm.append("rank",String(i));
      const uploadResponse=await etsyRequest("/application/shops/"+shopId+"/listings/"+listingId+"/images",{method:"POST",body:uploadForm});
      const uploaded=await json(uploadResponse);
      if(!uploadResponse.ok)throw new Error("Объявление #"+listingId+" создано, но Etsy не принял фото №"+(i+1)+": "+etsyError(uploaded,"ошибка загрузки изображения."));
    }

    const listingUrl="https://www.etsy.com/listing/"+listingId;
    const {error:saveError}=await supabase.from("petit_sot_artworks").update({
      etsy_listing_id:listingId,etsy_state:"draft",etsy_error:null,etsy_listing_url:listingUrl,etsy_synced_at:new Date().toISOString()
    }).eq("id",artwork.id);
    if(saveError)throw saveError;

    return NextResponse.json({ok:true,listingId,listingUrl,title:artwork.title});
  }catch(err:any){
    const message=err?.message||"Не удалось загрузить картину в Etsy.";
    await supabase.from("petit_sot_artworks").update({etsy_error:message,etsy_synced_at:new Date().toISOString()}).eq("id",artwork.id);
    return fail(message,500);
  }
}

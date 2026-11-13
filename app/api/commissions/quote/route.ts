import { NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const recent = new Map<string, number[]>();
function allowRequest(ip:string){
  const now=Date.now();
  const times=(recent.get(ip)||[]).filter(t=>now-t<60*60*1000);
  if(times.length>=3){recent.set(ip,times);return false;}
  times.push(now);recent.set(ip,times);
  if(recent.size>1000){for(const [key,value] of recent){if(!value.some(t=>now-t<60*60*1000))recent.delete(key);}}
  return true;
}
function validEmail(value:string){
  return value.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
async function verifyTurnstile(token:string,ip:string){
  const secret=process.env.TURNSTILE_SECRET_KEY;
  const siteKey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if(!secret&&!siteKey)return true;
  if(!secret||!siteKey||!token)return false;
  const body=new URLSearchParams({secret,response:token});
  if(ip&&ip!=="unknown")body.set("remoteip",ip);
  const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body,cache:"no-store"});
  if(!response.ok)return false;
  const result=await response.json() as {success?:boolean;hostname?:string};
  return result.success===true&&["petitsot.com","www.petitsot.com"].includes(String(result.hostname||""));
}
function calculate(width:number,height:number,complexity:string){
  const multiplier=complexity==="simple"?1:complexity==="detailed"?1.5:1.25;
  const raw=Math.max(180,width*height*0.10*multiplier);
  const price=Math.ceil(raw/10)*10;
  const area=(width*height)/1000;
  const extra=complexity==="simple"?0:complexity==="detailed"?14:7;
  const minDays=Math.round(28+area*3+extra);
  return {price,daysMin:minDays,daysMax:minDays+7};
}
async function notifyStudio(reference:string,name:string,email:string,description:string,price:number){
  const telegramToken=process.env.TELEGRAM_BOT_TOKEN;
  const chatIds=[process.env.TELEGRAM_CHAT_ID,...String(process.env.TELEGRAM_ADDITIONAL_CHAT_IDS||"").split(",")].map(x=>String(x||"").trim()).filter((x,i,a)=>x&&a.indexOf(x)===i);
  const resendKey=process.env.RESEND_API_KEY;
  const fromEmail=process.env.CONTACT_FROM_EMAIL;
  const tasks:Promise<unknown>[]=[];
  const message=["✦ PETIT.SOT — NEW COMMISSION REQUEST","", "Reference: "+reference,"Name: "+name,"Email: "+email,"Estimated price: €"+price,"","Description:",description].join("\n");
  if(telegramToken&&chatIds.length)for(const chatId of chatIds)tasks.push(fetch("https://api.telegram.org/bot"+telegramToken+"/sendMessage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:chatId,text:message}),cache:"no-store"}));
  if(resendKey&&fromEmail)tasks.push(fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+resendKey,"Content-Type":"application/json"},body:JSON.stringify({from:fromEmail,to:["manager@petitsot.com"],reply_to:email,subject:"New custom painting request — "+reference,text:message}),cache:"no-store"}));
  await Promise.allSettled(tasks);
}

export async function POST(request:Request){
  try{
    const length=Number(request.headers.get("content-length")||0);
    if(length>12000)return NextResponse.json({error:"Request is too large."},{status:413});
    const ip=(request.headers.get("x-forwarded-for")?.split(",")[0]||request.headers.get("x-real-ip")||"unknown").trim();
    if(!allowRequest(ip))return NextResponse.json({error:"Too many requests. Please try again later."},{status:429});
    const body=await request.json();
    if(String(body?.website||"").trim())return NextResponse.json({ok:true,hidden:true});
    const name=String(body?.name||"").trim().slice(0,80);
    const email=String(body?.email||"").trim().toLowerCase();
    const country=String(body?.country||"").trim().slice(0,80);
    const description=String(body?.description||"").trim();
    const palette=String(body?.palette||"").trim().slice(0,180);
    const complexity=["simple","medium","detailed"].includes(body?.complexity)?body.complexity:"medium";
    const width=Number(body?.width);
    const height=Number(body?.height);
    const style=String(body?.style||"").trim().slice(0,100);
    const captcha=String(body?.turnstileToken||"").trim();
    if(!name||!validEmail(email)||description.length<20||description.length>1800||!Number.isFinite(width)||!Number.isFinite(height)||width<20||height<20||width>200||height>200||width*height>30000){
      return NextResponse.json({error:"Please check your details, description and canvas dimensions."},{status:400});
    }
    if(!await verifyTurnstile(captcha,ip))return NextResponse.json({error:"Please complete the security check and try again."},{status:400});
    const hfToken=process.env.HF_TOKEN;
    if(!hfToken)return NextResponse.json({error:"The artwork preview service is not configured yet."},{status:503});
    const quote=calculate(width,height,complexity);
    const prompt=[
      "Create a refined original oil painting concept for PETIT.SOT STUDIO by artist Olga Trikhleb, with an atmospheric fine-art sensibility, expressive natural light, nuanced muted colours, layered brushwork and subtle oil-paint texture.",
      "The image is a visual reference for a future hand-painted oil-on-canvas artwork, not a photograph and not a finished physical artwork.",
      "Use visible painterly brushwork, subtle layered oil-paint texture, sophisticated natural colours, thoughtful composition and an atmospheric fine-art sensibility.",
      "Do not imitate a living artist or reproduce an existing artwork. Do not add text, signatures, watermarks, frames, borders or logos.",
      "The requested canvas proportion is "+width+" cm wide by "+height+" cm high. Compose the image in this exact aspect ratio.",
      "Subject and composition requested by the customer: "+description,
      style?"Preferred direction: "+style:"",
      palette?"Preferred palette: "+palette:"",
      "The result should look like a plausible original contemporary oil painting that Olga could interpret in her own hand, not a digitally perfect commercial illustration."
    ].filter(Boolean).join("\n");
    const hf=new InferenceClient(hfToken);
    const ratio=width/height;
    const longSide=1024;
    const shortSide=Math.max(512,Math.round((longSide/Math.max(ratio,1/ratio))/64)*64);
    const imageWidth=ratio>=1?longSide:shortSide;
    const imageHeight=ratio>=1?shortSide:longSide;
    const generated=await hf.textToImage({provider:"fal-ai",model:"black-forest-labs/FLUX.1-schnell",inputs:prompt,parameters:{guidance_scale:0,num_inference_steps:4,width:imageWidth,height:imageHeight}});
    if(!generated)return NextResponse.json({error:"The image model returned no preview. Please try again."},{status:502});
    let buffer:Buffer;let mime="image/png";
    if(generated instanceof Blob){buffer=Buffer.from(await generated.arrayBuffer());mime=generated.type||mime;}
    else if(typeof generated==="string"&&generated.startsWith("data:")){
      const match=generated.match(/^data:([^;]+);base64,(.+)$/);
      if(!match)return NextResponse.json({error:"The generated preview was invalid."},{status:502});
      mime=match[1];buffer=Buffer.from(match[2],"base64");
    }else return NextResponse.json({error:"The image model returned an unsupported format."},{status:502});
    if(!buffer.length||buffer.length>15*1024*1024)return NextResponse.json({error:"The generated preview could not be saved."},{status:502});
    const admin=createAdminClient();
    const reference="PS-C-"+new Date().getFullYear()+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
    const extension=mime.includes("webp")?"webp":mime.includes("jpeg")?"jpg":"png";
    const path="commissions/"+reference+"/concept."+extension;
    const upload=await admin.storage.from("petit-sot-artworks").upload(path,buffer,{contentType:mime,upsert:false});
    if(upload.error)throw upload.error;
    const {data:row,error}=await admin.from("petit_sot_commissions").insert({
      reference_code:reference,status:"new",customer_name:name,customer_email:email,customer_country:country||null,
      description,requested_style:style||"Olga Trikhleb oil painting",palette:palette||null,complexity,
      width_cm:width,height_cm:height,medium:"Oil on canvas",preview_image_path:path,
      estimated_price_eur:quote.price,estimated_days_min:quote.daysMin,estimated_days_max:quote.daysMax
    }).select("id,reference_code,estimated_price_eur,estimated_days_min,estimated_days_max").single();
    if(error){await admin.storage.from("petit-sot-artworks").remove([path]);throw error;}
    await notifyStudio(reference,name,email,description,quote.price);
    const imageUrl=admin.storage.from("petit-sot-artworks").getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ok:true,commission:row,imageUrl,depositEstimate:Math.round(quote.price/2)});
  }catch(error:any){
    console.error("Commission request failed",error);
    return NextResponse.json({error:error?.message||"Could not create your commission request."},{status:500});
  }
}

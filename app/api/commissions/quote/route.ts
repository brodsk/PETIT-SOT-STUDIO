import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    const quote=calculate(width,height,complexity);
    let buffer:Buffer|null=null;let mime="image/png";let previewError:string|undefined;
    const geminiKey=process.env.GEMINI_API_KEY;
    if(geminiKey){
      try{
        const admin=createAdminClient();
        const monthStart=new Date().toISOString().slice(0,7)+"-01";
        const ipSecret=process.env.TURNSTILE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||"commission-ai";
        const ipHash=createHash("sha256").update(ipSecret+":"+ip).digest("hex");
        const reservation=await admin.rpc("reserve_commission_ai_generation",{
          p_month:monthStart,p_ip_hash:ipHash,p_cost_cents:8,p_limit_cents:500
        });
        if(reservation.error)throw reservation.error;
        const quota=reservation.data as {ok?:boolean;reason?:string};
        if(quota?.ok!==true){
          previewError=quota?.reason==="monthly_budget"?"monthly_budget_reached":"generation_limit_reached";
        }else{
          const prompt=[
            "Create a refined original oil painting concept for PETIT.SOT STUDIO by artist Olga Trikhleb, with an atmospheric fine-art sensibility, expressive natural light, nuanced muted colours, layered brushwork and subtle oil-paint texture.",
            "The image is a visual reference for a future hand-painted oil-on-canvas artwork, not a photograph and not a finished physical artwork.",
            "Use visible painterly brushwork, subtle layered oil-paint texture, sophisticated natural colours, thoughtful composition and an atmospheric fine-art sensibility.",
            "Do not imitate a living artist or reproduce an existing artwork. Do not add text, signatures, watermarks, frames, borders or logos.",
            "The requested canvas proportion is "+width+" cm wide by "+height+" cm high. Compose the image in this proportion as closely as supported.",
            "Subject and composition requested by the customer: "+description,
            style?"Preferred direction: "+style:"",
            palette?"Preferred palette: "+palette:"",
            "The result should look like a plausible original contemporary oil painting that Olga could interpret in her own hand, not a digitally perfect commercial illustration."
          ].filter(Boolean).join("\\n");
          const ratio=width/height;
          const ratios=[["1:1",1],["3:2",1.5],["2:3",2/3],["4:3",4/3],["3:4",.75],["5:4",1.25],["4:5",.8],["16:9",16/9],["9:16",9/16],["21:9",21/9],["4:1",4],["1:4",.25],["8:1",8],["1:8",.125]];
          const aspectRatio=ratios.reduce((best,item)=>Math.abs(Math.log(item[1]/ratio))<Math.abs(Math.log(best[1]/ratio))?item:best,ratios[0])[0];
          const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent",{
            method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":geminiKey},
            body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:["IMAGE"],imageConfig:{aspectRatio,imageSize:"1K"}}}),
            cache:"no-store",signal:AbortSignal.timeout(50000)
          });
          if(!response.ok)throw new Error("Gemini image generation returned HTTP "+response.status);
          const result=await response.json() as {candidates?:Array<{content?:{parts?:Array<{inlineData?:{mimeType?:string;data?:string}}>} }>};
          const imagePart=result.candidates?.[0]?.content?.parts?.find(part=>part.inlineData?.data);
          if(!imagePart?.inlineData?.data)throw new Error("Gemini returned no image data.");
          mime=imagePart.inlineData.mimeType||"image/png";
          buffer=Buffer.from(imagePart.inlineData.data,"base64");
          if(!buffer.length||buffer.length>15*1024*1024)throw new Error("Gemini returned an invalid preview.");
        }
      }catch(error){
        previewError="temporarily_unavailable";
        console.warn("Gemini commission preview unavailable; keeping request available:",error);
        buffer=null;
      }
    }else{previewError="temporarily_unavailable";}
    const admin=createAdminClient();
    const reference="PS-C-"+new Date().getFullYear()+"-"+crypto.randomUUID().replace(/-/g,"").slice(0,12).toUpperCase();
    let path:string|null=null;
    if(buffer){
      const extension=mime.includes("webp")?"webp":mime.includes("jpeg")?"jpg":"png";
      path="commissions/"+reference+"/concept."+extension;
      const upload=await admin.storage.from("petit-sot-artworks").upload(path,buffer,{contentType:mime,upsert:false});
      if(upload.error)throw upload.error;
    }
    const {data:row,error}=await admin.from("petit_sot_commissions").insert({
      reference_code:reference,status:"new",customer_name:name,customer_email:email,customer_country:country||null,
      description,requested_style:style||"Olga Trikhleb oil painting",palette:palette||null,complexity,
      width_cm:width,height_cm:height,medium:"Oil on canvas",preview_image_path:path,
      estimated_price_eur:quote.price,estimated_days_min:quote.daysMin,estimated_days_max:quote.daysMax
    }).select("id,reference_code,estimated_price_eur,estimated_days_min,estimated_days_max").single();
    if(error){if(path)await admin.storage.from("petit-sot-artworks").remove([path]);throw error;}
    await notifyStudio(reference,name,email,description,quote.price);
    const imageUrl=path?admin.storage.from("petit-sot-artworks").getPublicUrl(path).data.publicUrl:null;
    return NextResponse.json({ok:true,commission:row,imageUrl,previewAvailable:Boolean(imageUrl),previewError:previewError||null,depositEstimate:Math.round(quote.price/2)});
  }catch(error:any){
    console.error("Commission request failed",error);
    return NextResponse.json({error:error?.message||"Could not create your commission request."},{status:500});
  }
}

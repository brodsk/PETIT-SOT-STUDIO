import {NextResponse} from "next/server";
import {createHash,randomUUID} from "node:crypto";
import {createAdminClient} from "../../../../lib/supabase/admin";
export const runtime="nodejs";export const maxDuration=60;
async function verify(token:string,ip:string){const secret=process.env.TURNSTILE_SECRET_KEY,site=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;if(!secret&&!site)return true;if(!secret||!site||!token)return false;const b=new URLSearchParams({secret,response:token});if(ip!=="unknown")b.set("remoteip",ip);const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:b,cache:"no-store"});if(!r.ok)return false;const d=await r.json();return d.success===true&&["petitsot.com","www.petitsot.com"].includes(String(d.hostname||""));}
export async function POST(request:Request){try{
 const body=await request.json();const ip=(request.headers.get("x-forwarded-for")?.split(",")[0]||request.headers.get("x-real-ip")||"unknown").trim();
 const description=String(body.description||"").trim(),style=String(body.style||"").slice(0,100),palette=String(body.palette||"").slice(0,180),width=Number(body.width),height=Number(body.height);
 if(String(body.website||"").trim())return NextResponse.json({ok:true,hidden:true});
 if(description.length<20||description.length>1800||!Number.isFinite(width)||!Number.isFinite(height)||width<20||height<20||width>200||height>200||width*height>30000)return NextResponse.json({error:"Please check the description and canvas dimensions."},{status:400});
 if(!await verify(String(body.turnstileToken||""),ip))return NextResponse.json({error:"Please complete the security check."},{status:400});
 const key=process.env.GEMINI_API_KEY;if(!key)return NextResponse.json({error:"The concept generator is temporarily unavailable."},{status:503});
 const db=createAdminClient(),month=new Date().toISOString().slice(0,7)+"-01",secret=process.env.TURNSTILE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||"commission-ai";
 const hash=createHash("sha256").update(secret+":"+ip).digest("hex");
 const reservation=await db.rpc("reserve_commission_ai_generation",{p_month:month,p_ip_hash:hash,p_cost_cents:8,p_limit_cents:500});
 if(reservation.error)throw reservation.error;const quota=reservation.data as {ok?:boolean;reason?:string};
 if(!quota?.ok)return NextResponse.json({error:quota?.reason==="monthly_budget"?"The monthly concept-generation allowance has been reached.":"The generation limit has been reached.",...(quota?.reason==="rate_limit"?{retryAfterSeconds:Number((quota as any).retry_after_seconds)||3600}:{})},{status:429});
 const prompt=["Create a refined original oil painting concept for PETIT.SOT STUDIO by artist Olga Trikhleb. This is a visual reference for a future hand-painted oil-on-canvas artwork, not a photograph.","Visible painterly brushwork, nuanced natural colours, expressive light, atmospheric fine-art composition. No text, signature, watermark, frame or logo.","Canvas proportion: "+width+" cm wide by "+height+" cm high.","Customer's subject and composition: "+description,style?"Art direction: "+style:"",palette?"Preferred palette: "+palette:"","Make this a plausible original contemporary oil painting that an artist could interpret by hand."].filter(Boolean).join("\n");
 const ratios:Array<[string,number]>=[["1:1",1],["3:2",1.5],["2:3",2/3],["4:3",4/3],["3:4",.75],["5:4",1.25],["4:5",.8],["16:9",16/9],["9:16",9/16],["21:9",21/9]];
 const ratio=width/height,aspectRatio=ratios.reduce((a,b)=>Math.abs(Math.log(b[1]/ratio))<Math.abs(Math.log(a[1]/ratio))?b:a,ratios[0])[0];
 const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:["IMAGE"],imageConfig:{aspectRatio,imageSize:"1K"}}}),cache:"no-store",signal:AbortSignal.timeout(50000)});
 if(!response.ok)throw new Error("Gemini image generation failed ("+response.status+").");
 const result=await response.json() as {candidates?:Array<{content?:{parts?:Array<{inlineData?:{mimeType?:string;data?:string}}>} }>};
 const part=result.candidates?.[0]?.content?.parts?.find(x=>x.inlineData?.data);if(!part?.inlineData?.data)throw new Error("Gemini returned no image.");
 const mime=part.inlineData.mimeType||"image/png",buffer=Buffer.from(part.inlineData.data,"base64");if(!buffer.length||buffer.length>15*1024*1024)throw new Error("Invalid generated image.");
 const ext=mime.includes("webp")?"webp":mime.includes("jpeg")?"jpg":"png",path="commission-concepts/"+randomUUID()+"."+ext;
 const upload=await db.storage.from("petit-sot-artworks").upload(path,buffer,{contentType:mime,upsert:false});if(upload.error)throw upload.error;
 return NextResponse.json({ok:true,imageUrl:db.storage.from("petit-sot-artworks").getPublicUrl(path).data.publicUrl,previewImagePath:path});
 }catch(e:any){console.error("Commission concept generation failed",e);return NextResponse.json({error:e?.message||"Could not generate the concept."},{status:503});}}

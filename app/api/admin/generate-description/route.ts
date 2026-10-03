import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export const runtime="nodejs";

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data:admin}=await supabase.from("petit_sot_admins").select("user_id").eq("user_id",user.id).maybeSingle();
  if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
  const body=await request.json();
  if(!body.imageDataUrl)return NextResponse.json({error:"Artwork image is required."},{status:400});
  if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:"OPENAI_API_KEY is not configured yet."},{status:503});

  const metadata=[body.title&&`Title: ${body.title}`,body.year&&`Year: ${body.year}`,body.medium&&`Medium: ${body.medium}`,body.width_cm&&body.height_cm&&`Dimensions: ${body.width_cm} × ${body.height_cm} cm`,body.depth_cm&&`Depth: ${body.depth_cm} cm`].filter(Boolean).join("\n");
  const prompt=`You are writing a refined contemporary-art catalogue description for PETIT.SOT STUDIO and artist Olga Trikhleb.

Look carefully at the supplied artwork image. Describe only what can reasonably be observed: composition, forms, palette, material appearance, gesture, texture, spatial relationships and visual atmosphere. Do not invent symbolism, biography, provenance, dimensions, medium, date or facts. Metadata supplied below is factual and may be used only as given.

Write 90–150 words in elegant but restrained English. Avoid clichés, exaggerated claims, art-world jargon and phrases like "invites the viewer". Do not mention that you are AI.
${metadata}`;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_VISION_MODEL||"gpt-6-luna",input:[{role:"user",content:[{type:"input_text",text:prompt},{type:"input_image",image_url:body.imageDataUrl,detail:"high"}]}],max_output_tokens:500})});
  if(!response.ok){const detail=await response.text();return NextResponse.json({error:"OpenAI request failed.",detail:detail.slice(0,500)},{status:502});}
  const data=await response.json();
  const description=data.output_text || data.output?.flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==="output_text")?.text || "";
  if(!description)return NextResponse.json({error:"The AI returned no description."},{status:502});
  return NextResponse.json({description:description.trim()});
}

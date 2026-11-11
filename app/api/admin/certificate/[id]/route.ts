import {NextResponse} from "next/server";
import {PDFDocument,StandardFonts,rgb} from "pdf-lib";
import {createClient} from "../../../../../lib/supabase/server";

export const runtime="nodejs";

function ascii(value:unknown){
 return String(value??"")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g,"")
  .replace(/€/g,"EUR")
  .replace(/×/g,"x")
  .replace(/[–—]/g,"-")
  .replace(/[“”]/g,'"')
  .replace(/[‘’]/g,"'")
  .replace(/[^\x20-\x7E]/g,"");
}

async function translateMediumToEnglish(value:unknown){
 const source=String(value??"").trim();
 if(!source)return "Not specified";
 if(!/[А-Яа-яЁё]/.test(source))return source;
 const apiKey=process.env.GEMINI_API_KEY;
 if(apiKey){
  try{
   const model=process.env.GEMINI_MODEL||"gemini-3.5-flash-lite";
   const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-goog-api-key":apiKey},
    body:JSON.stringify({
     contents:[{role:"user",parts:[{text:"Translate this artwork medium/material description from Russian into concise, natural English for a fine-art certificate. Preserve the exact technique and materials; do not add facts. Return only the translated phrase, with no quotes or explanation.\n\n"+source}]}],
     generationConfig:{temperature:0.1,maxOutputTokens:100}
    }),
    signal:AbortSignal.timeout(10000)
   });
   if(response.ok){
    const data=await response.json();
    const translated=String(data.candidates?.[0]?.content?.parts?.map((part:any)=>part.text).filter(Boolean).join(" ")||"").trim().replace(/^["']|["']$/g,"");
    if(translated&&!/[А-Яа-яЁё]/.test(translated))return translated;
   }
  }catch(error){console.error("Certificate medium translation failed:",error);}
 }
 const normalized=source.toLowerCase().replace(/ё/g,"е").replace(/\\s+/g," ").trim();
 const known:Record<string,string>={
  "масло на холсте":"Oil on canvas",
  "масло, холст":"Oil on canvas",
  "масло холст":"Oil on canvas",
  "акрил на холсте":"Acrylic on canvas",
  "акрил, холст":"Acrylic on canvas",
  "акрил холст":"Acrylic on canvas",
  "акварель на бумаге":"Watercolor on paper",
  "акварель, бумага":"Watercolor on paper",
  "гуашь на бумаге":"Gouache on paper",
  "пастель на бумаге":"Pastel on paper",
  "масло":"Oil paint",
  "акрил":"Acrylic paint"
 };
 return known[normalized]||"Medium details available from the artist";
}

function wrapText(value:string,font:any,size:number,maxWidth:number){
 const words=value.split(/\s+/).filter(Boolean);
 const lines:string[]=[];
 let line="";
 for(const word of words){
  const next=line?line+" "+word:word;
  if(font.widthOfTextAtSize(next,size)>maxWidth&&line){lines.push(line);line=word;}
  else line=next;
 }
 if(line)lines.push(line);
 return lines;
}

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data:admin}=await supabase.from("petit_sot_admins").select("user_id").eq("user_id",user.id).maybeSingle();
 if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await params;
 const {data:w,error}=await supabase.from("petit_sot_artworks").select("*").eq("id",id).single();
 if(error||!w)return NextResponse.json({error:"Artwork not found."},{status:404});

 let cert=w.certificate_number;
 if(!cert){
  cert=`PS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const {error:updateError}=await supabase.from("petit_sot_artworks").update({certificate_number:cert}).eq("id",id);
  if(updateError)return NextResponse.json({error:"Could not save certificate number."},{status:500});
 }

 const pdf=await PDFDocument.create();
 const page=pdf.addPage([720,540]);
 const regular=await pdf.embedFont(StandardFonts.Helvetica);
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const italic=await pdf.embedFont(StandardFonts.HelveticaOblique);
 const ink=rgb(.12,.12,.11);
 const muted=rgb(.43,.42,.39);
 const paper=rgb(.965,.953,.925);
 const rule=rgb(.72,.70,.65);
 page.drawRectangle({x:0,y:0,width:720,height:540,color:paper});
 page.drawRectangle({x:22,y:22,width:676,height:496,borderColor:rule,borderWidth:.65});
 page.drawLine({start:{x:42,y:477},end:{x:678,y:477},thickness:.7,color:rule});
 page.drawText("PETIT.SOT STUDIO",{x:42,y:493,size:8,font:bold,color:muted});
 page.drawText("ORIGINAL ARTWORK",{x:678-regular.widthOfTextAtSize("ORIGINAL ARTWORK",7),y:493,size:7,font:regular,color:muted});
 page.drawText("CERTIFICATE OF AUTHENTICITY",{x:42,y:437,size:25,font:regular,color:ink});
 page.drawText("This document certifies that the artwork shown is an original, one-of-a-kind work.",{x:43,y:416,size:8,font:regular,color:muted});
 page.drawText("All copyright and reproduction rights remain with the artist unless otherwise agreed in writing.",{x:43,y:403,size:8,font:regular,color:muted});

 let artworkImage:any=null;
 if(w.image_path){
  try{
   const imageUrl=supabase.storage.from("petit-sot-artworks").getPublicUrl(w.image_path).data.publicUrl;
   const imageRes=await fetch(imageUrl,{cache:"no-store"});
   if(imageRes.ok){
    const bytes=await imageRes.arrayBuffer();
    const type=(imageRes.headers.get("content-type")||"").toLowerCase();
    if(type.includes("png"))artworkImage=await pdf.embedPng(bytes);
    else if(type.includes("jpeg")||type.includes("jpg"))artworkImage=await pdf.embedJpg(bytes);
   }
  }catch(error){console.error("Certificate artwork image could not be embedded:",error);}
 }
 const imageBox={x:43,y:218,width:190,height:166};
 page.drawRectangle({x:imageBox.x-1,y:imageBox.y-1,width:imageBox.width+2,height:imageBox.height+2,borderColor:rule,borderWidth:.5});
 if(artworkImage){
  const scale=Math.min(imageBox.width/artworkImage.width,imageBox.height/artworkImage.height);
  const width=artworkImage.width*scale,height=artworkImage.height*scale;
  page.drawImage(artworkImage,{x:imageBox.x+(imageBox.width-width)/2,y:imageBox.y+(imageBox.height-height)/2,width,height});
 }else{
  page.drawText("ARTWORK IMAGE",{x:124,y:292,size:10,font:regular,color:muted});
 }

 const artistX=260;
 page.drawText("ARTIST",{x:artistX,y:375,size:7,font:bold,color:muted});
 page.drawText("OLGA TRIKHLEB",{x:artistX,y:356,size:15,font:regular,color:ink});
 const statement="An original work created by the artist. This certificate identifies the unique artwork listed below.";
 for(const [i,line] of wrapText(statement,regular,8,270).entries()){
  page.drawText(line,{x:artistX,y:332-i*12,size:8,font:regular,color:muted});
 }

 const publicUrl=`https://www.petitsot.com/verify/${encodeURIComponent(cert)}`;
 if(publicUrl){
  try{
   const qrUrl="https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=png&margin=0&data="+encodeURIComponent(publicUrl);
   const qrResponse=await fetch(qrUrl,{cache:"no-store",signal:AbortSignal.timeout(8000)});
   if(qrResponse.ok){
    const qr=await pdf.embedPng(await qrResponse.arrayBuffer());
    page.drawImage(qr,{x:610,y:299,width:58,height:58});
    page.drawText("VERIFY CERTIFICATE",{x:605,y:287,size:6,font:bold,color:muted});
   }
  }catch(error){console.error("Certificate QR code could not be generated:",error);}
 }

 page.drawLine({start:{x:42,y:198},end:{x:678,y:198},thickness:.7,color:rule});
 const title=ascii(w.title||"Untitled");
 page.drawText("TITLE",{x:43,y:177,size:7,font:bold,color:muted});
 page.drawText(title||"Untitled",{x:158,y:175,size:11,font:italic,color:ink});
 page.drawLine({start:{x:43,y:164},end:{x:678,y:164},thickness:.45,color:rule});

 const dimensions=[w.width_cm,w.height_cm].filter((v:any)=>v!==null&&v!==undefined&&v!=="").join(" x ");
 const rows:[string,string][]=[
  ["MEDIUM",ascii(await translateMediumToEnglish(w.medium))||"Not specified"],
  ["DIMENSIONS",dimensions?dimensions+" CM":"-"],
  ["YEAR",String(w.year||"-")],
  ["EDITION","UNIQUE ORIGINAL ARTWORK"],
  ["CERTIFICATE NO.",ascii(cert)]
 ];
 let rowY=146;
 for(const [label,value] of rows){
  page.drawText(label,{x:43,y:rowY,size:7,font:bold,color:muted});
  page.drawText(value.slice(0,76),{x:158,y:rowY-1,size:9,font:regular,color:ink});
  page.drawLine({start:{x:43,y:rowY-8},end:{x:678,y:rowY-8},thickness:.35,color:rule});
  rowY-=21;
 }

 page.drawText("ARTIST SIGNATURE",{x:43,y:57,size:7,font:bold,color:muted});
 page.drawLine({start:{x:145,y:48},end:{x:420,y:48},thickness:.75,color:rule});
 page.drawText("OLGA TRIKHLEB",{x:145,y:29,size:9,font:italic,color:ink});
 page.drawText("ISSUED BY PETIT.SOT STUDIO",{x:678-regular.widthOfTextAtSize("ISSUED BY PETIT.SOT STUDIO",6),y:34,size:6,font:regular,color:muted});
 const pdfBytes=await pdf.save();
 const safeSlug=ascii(w.slug||"artwork").replace(/[^a-zA-Z0-9_-]/g,"-");
 return new NextResponse(Buffer.from(pdfBytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${safeSlug}-certificate-of-authenticity.pdf"`,"Cache-Control":"no-store"}});
}

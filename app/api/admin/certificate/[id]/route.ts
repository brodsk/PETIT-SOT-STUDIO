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
 const page=pdf.addPage([595.28,841.89]);
 const font=await pdf.embedFont(StandardFonts.Helvetica);
 const italic=await pdf.embedFont(StandardFonts.HelveticaOblique);
 const black=rgb(.09,.09,.09);
 const grey=rgb(.4,.4,.4);

 page.drawText("PETIT.SOT STUDIO",{x:44,y:792,size:14,font,color:black});
 page.drawText("CERTIFICATE / ARTWORK PASSPORT",{x:44,y:767,size:8,font,color:grey});

 let y=720;
 if(w.image_path){
  const imageUrl=supabase.storage.from("petit-sot-artworks").getPublicUrl(w.image_path).data.publicUrl;
  const imageRes=await fetch(imageUrl,{cache:"no-store"});
  if(imageRes.ok){
   const imageBytes=await imageRes.arrayBuffer();
   const type=imageRes.headers.get("content-type")||"";
   let image:any=null;
   if(type.includes("png"))image=await pdf.embedPng(imageBytes);
   else if(type.includes("jpeg")||type.includes("jpg"))image=await pdf.embedJpg(imageBytes);
   if(image){
    const scale=Math.min(507/image.width,420/image.height);
    page.drawImage(image,{x:44,y:y-420,width:image.width*scale,height:image.height*scale});
    y-=445;
   }
  }
 }

 const title=ascii(w.title_en||w.title||"Untitled");
 page.drawText(title||"Untitled",{x:44,y,size:27,font:italic,color:black});
 y-=34;
 page.drawText(`Olga Trikhleb · ${w.year||"-"}`,{x:44,y,size:10,font,color:black});
 y-=24;

 const dimensions=[w.width_cm,w.height_cm].filter(Boolean).join(" x ");
 const lines:[string,string][]=[
  ["Medium",ascii(w.medium||"-")||"-"],
  ["Dimensions",dimensions?dimensions+" cm":"-"],
  ["Price",`EUR ${Number(w.price_eur||0).toFixed(2)}`],
  ["Certificate",ascii(cert)]
 ];
 for(const [label,value] of lines){
  page.drawText(label.toUpperCase(),{x:44,y,size:7,font,color:grey});
  page.drawText(ascii(value)||"-",{x:160,y,size:10,font,color:black});
  y-=19;
 }

 y-=12;
 const desc=ascii(w.description_en||w.ai_description||w.description||"").slice(0,1000);
 const words=desc.split(/\s+/);
 let line="";
 const wrapped:string[]=[];
 for(const word of words){
  const next=line?line+" "+word:word;
  if(font.widthOfTextAtSize(next,9)>507){if(line)wrapped.push(line);line=word;}else line=next;
 }
 if(line)wrapped.push(line);
 for(const l of wrapped.slice(0,10)){page.drawText(l,{x:44,y,size:9,font,color:black});y-=13;}

 page.drawText("PETIT.SOT STUDIO - Olga Trikhleb",{x:44,y:35,size:7,font,color:grey});
 page.drawText(new Date().toLocaleDateString("en-GB"),{x:465,y:35,size:7,font,color:grey});
 const pdfBytes=await pdf.save();
 return new NextResponse(Buffer.from(pdfBytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${w.slug}-passport.pdf"`,"Cache-Control":"no-store"}});
}

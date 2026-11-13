import {NextResponse} from "next/server";
import {PDFDocument,StandardFonts,rgb} from "pdf-lib";
import {createClient} from "../../../../../../lib/supabase/server";
import {createAdminClient} from "../../../../../../lib/supabase/admin";
export const runtime="nodejs";
function ascii(v:unknown){return String(v??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/€/g,"EUR").replace(/×/g,"x").replace(/[–—]/g,"-").replace(/[^\x20-\x7E]/g,"");}
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const auth=await createClient();const {data:{user}}=await auth.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data:adminRow}=await auth.from("petit_sot_admins").select("user_id").eq("user_id",user.id).maybeSingle();if(!adminRow)return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await params;const db=createAdminClient();const {data:w,error}=await db.from("petit_sot_commissions").select("*").eq("id",id).single();
 if(error||!w)return NextResponse.json({error:"Commission not found."},{status:404});
 if(!w.final_image_path||!w.final_artwork_title)return NextResponse.json({error:"Upload the finished artwork and set its title before creating the certificate."},{status:409});
 if(!["ready_to_ship","shipped","completed"].includes(w.status))return NextResponse.json({error:"The certificate is available after the painting is finished."},{status:409});
 let cert=w.certificate_number;
 if(!cert){cert="PS-"+new Date().getFullYear()+"-"+String(Date.now()).slice(-6);const {error:updateError}=await db.from("petit_sot_commissions").update({certificate_number:cert}).eq("id",id);if(updateError)throw updateError;}
 const pdf=await PDFDocument.create();const page=pdf.addPage([720,540]);const regular=await pdf.embedFont(StandardFonts.Helvetica);const bold=await pdf.embedFont(StandardFonts.HelveticaBold);const italic=await pdf.embedFont(StandardFonts.HelveticaOblique);
 const ink=rgb(.12,.12,.11),muted=rgb(.43,.42,.39),paper=rgb(.965,.953,.925),rule=rgb(.72,.70,.65);
 page.drawRectangle({x:0,y:0,width:720,height:540,color:paper});page.drawRectangle({x:22,y:22,width:676,height:496,borderColor:rule,borderWidth:.65});
 page.drawLine({start:{x:42,y:477},end:{x:678,y:477},thickness:.7,color:rule});page.drawText("PETIT.SOT STUDIO",{x:42,y:493,size:8,font:bold,color:muted});page.drawText("ORIGINAL ARTWORK",{x:568,y:493,size:7,font:regular,color:muted});
 page.drawText("CERTIFICATE OF AUTHENTICITY",{x:42,y:437,size:25,font:regular,color:ink});page.drawText("This document certifies that the artwork shown is an original, one-of-a-kind work.",{x:43,y:416,size:8,font:regular,color:muted});
 const url=db.storage.from("petit-sot-artworks").getPublicUrl(w.final_image_path).data.publicUrl;const res=await fetch(url,{cache:"no-store"});if(!res.ok)throw new Error("Could not load the finished artwork image.");const bytes=await res.arrayBuffer();const type=(res.headers.get("content-type")||"").toLowerCase();const img=type.includes("png")?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);
 const box={x:43,y:218,width:190,height:166};const scale=Math.min(box.width/img.width,box.height/img.height);const iw=img.width*scale,ih=img.height*scale;page.drawImage(img,{x:box.x+(box.width-iw)/2,y:box.y+(box.height-ih)/2,width:iw,height:ih});
 page.drawText("ARTIST",{x:260,y:375,size:7,font:bold,color:muted});page.drawText("OLGA TRIKHLEB",{x:260,y:356,size:15,font:regular,color:ink});page.drawText("An original work created by the artist for a private commission.",{x:260,y:332,size:8,font:regular,color:muted});
 const verify="https://www.petitsot.com/verify/"+encodeURIComponent(cert);try{const qrRes=await fetch("https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=png&margin=0&data="+encodeURIComponent(verify),{cache:"no-store",signal:AbortSignal.timeout(8000)});if(qrRes.ok){const qr=await pdf.embedPng(await qrRes.arrayBuffer());page.drawImage(qr,{x:610,y:299,width:58,height:58});page.drawText("VERIFY CERTIFICATE",{x:605,y:287,size:6,font:bold,color:muted});}}catch{}
 page.drawLine({start:{x:42,y:198},end:{x:678,y:198},thickness:.7,color:rule});
 const rows:[string,string][]=[["TITLE",ascii(w.final_artwork_title)],["MEDIUM",ascii(w.final_medium||"Oil on canvas")],["DIMENSIONS",w.width_cm+" x "+w.height_cm+" CM"],["YEAR",String(w.final_year||new Date().getFullYear())],["EDITION","UNIQUE ORIGINAL ARTWORK"],["CERTIFICATE NO.",ascii(cert)]];
 let y=177;for(const [label,value] of rows){page.drawText(label,{x:43,y,size:7,font:bold,color:muted});page.drawText(value.slice(0,76),{x:158,y:y-1,size:9,font:regular,color:ink});page.drawLine({start:{x:43,y:y-8},end:{x:678,y:y-8},thickness:.35,color:rule});y-=19;}
 page.drawText("ARTIST SIGNATURE",{x:43,y:41,size:7,font:bold,color:muted});page.drawLine({start:{x:43,y:31},end:{x:485,y:31},thickness:.75,color:rule});page.drawText("OLGA TRIKHLEB",{x:505,y:28,size:8,font:italic,color:ink});
 const pdfBytes=await pdf.save();const file="commission-"+ascii(cert)+"-certificate-of-authenticity.pdf";
 return new NextResponse(Buffer.from(pdfBytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="'+file+'"',"Cache-Control":"no-store"}});
}

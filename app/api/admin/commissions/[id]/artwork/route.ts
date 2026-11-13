import {NextResponse} from "next/server";
import {createClient} from "../../../../../../lib/supabase/server";
import {createAdminClient} from "../../../../../../lib/supabase/admin";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const auth=await createClient();const {data:{user}}=await auth.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data:adminRow}=await auth.from("petit_sot_admins").select("user_id").eq("user_id",user.id).maybeSingle();if(!adminRow)return NextResponse.json({error:"Forbidden"},{status:403});
  const {id}=await params;const form=await request.formData();const file=form.get("image");const title=String(form.get("title")||"").trim();const year=Number(form.get("year"))||new Date().getFullYear();
  if(!(file instanceof File)||!["image/jpeg","image/png"].includes(file.type)||file.size>15*1024*1024)return NextResponse.json({error:"Choose a JPG, PNG or WEBP image up to 15 MB."},{status:400});
  if(!title||title.length>140)return NextResponse.json({error:"Enter the final artwork title."},{status:400});
  const db=createAdminClient();const {data:commission,error}=await db.from("petit_sot_commissions").select("id,reference_code").eq("id",id).single();if(error||!commission)return NextResponse.json({error:"Commission not found."},{status:404});
  const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";const path="commissions/"+commission.reference_code+"/final."+ext;
  const upload=await db.storage.from("petit-sot-artworks").upload(path,Buffer.from(await file.arrayBuffer()),{contentType:file.type,upsert:true});if(upload.error)throw upload.error;
  const {data,error:updateError}=await db.from("petit_sot_commissions").update({final_artwork_title:title,final_year:year,final_image_path:path,updated_at:new Date().toISOString()}).eq("id",id).select("id,final_artwork_title,final_year,final_image_path").single();if(updateError)throw updateError;
  return NextResponse.json({artwork:data,imageUrl:db.storage.from("petit-sot-artworks").getPublicUrl(path).data.publicUrl});
 }catch(error:any){console.error("Commission artwork upload failed",error);return NextResponse.json({error:error?.message||"Could not save the final artwork."},{status:500});}
}

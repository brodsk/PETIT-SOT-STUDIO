import {requireAdmin} from "../../../lib/admin";
import {createAdminClient} from "../../../lib/supabase/admin";
import CommissionsAdmin from "./CommissionsAdmin";
export const dynamic="force-dynamic";
export default async function AdminCommissionsPage(){
 await requireAdmin();const db=createAdminClient();
 const {data,error}=await db.from("petit_sot_commissions").select("*").order("created_at",{ascending:false});
 if(error)throw new Error("Could not load commission requests.");
 const rows=await Promise.all((data||[]).map(async(item:any)=>{const referenceImage=item.reference_image_path?await db.storage.from("commission-references").createSignedUrl(item.reference_image_path,3600):{data:null};return {...item,reference_image_url:referenceImage.data?.signedUrl||null,preview_url:item.preview_image_path?db.storage.from("petit-sot-artworks").getPublicUrl(item.preview_image_path).data.publicUrl:null,final_image_url:item.final_image_path?db.storage.from("petit-sot-artworks").getPublicUrl(item.final_image_path).data.publicUrl:null};}));
 return <CommissionsAdmin initial={rows}/>;
}

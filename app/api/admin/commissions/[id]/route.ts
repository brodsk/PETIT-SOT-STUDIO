import {NextResponse} from "next/server";
import {createClient} from "../../../../../lib/supabase/server";
import {createAdminClient} from "../../../../../lib/supabase/admin";
export const runtime="nodejs";
const allowed=new Set(["new","reviewing","approved","awaiting_deposit","in_progress","drying","ready_to_ship","shipped","completed","declined","cancelled"]);
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const auth=await createClient();const {data:{user}}=await auth.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data:adminRow}=await auth.from("petit_sot_admins").select("user_id").eq("user_id",user.id).maybeSingle();if(!adminRow)return NextResponse.json({error:"Forbidden"},{status:403});
  const {id}=await params;const body=await request.json();const db=createAdminClient();
  const {data:current,error:readError}=await db.from("petit_sot_commissions").select("*").eq("id",id).single();if(readError||!current)return NextResponse.json({error:"Commission not found."},{status:404});
  const status=body.status?String(body.status):current.status;if(!allowed.has(status))return NextResponse.json({error:"Invalid status."},{status:400});
  const finalPrice=body.finalPrice!==undefined?Number(body.finalPrice):Number(current.final_price_eur??current.estimated_price_eur);
  if((status==="approved"||status==="awaiting_deposit")&&(!Number.isFinite(finalPrice)||finalPrice<100||finalPrice>50000))return NextResponse.json({error:"Set a valid final price before approving the commission."},{status:400});
  if(current.deposit_paid_at&&Number.isFinite(finalPrice)&&Math.abs(finalPrice-Number(current.final_price_eur))>.001)return NextResponse.json({error:"The final price cannot be changed after the deposit has been paid."},{status:409});
  if(["in_progress","drying","ready_to_ship","shipped","completed"].includes(status)&&!current.deposit_paid_at)return NextResponse.json({error:"The 50% deposit must be paid before production can begin."},{status:409});
  if(["shipped","completed"].includes(status)&&Number(current.balance_amount_eur)>0&&!current.balance_paid_at)return NextResponse.json({error:"The remaining 50% balance must be paid before dispatch or completion."},{status:409});
  if(status==="ready_to_ship"&&(!current.final_image_path||!current.final_artwork_title))return NextResponse.json({error:"Upload the finished painting and its English title before marking it ready to ship."},{status:409});
  if(["shipped","completed"].includes(status)&&!current.certificate_number)return NextResponse.json({error:"Generate the authenticity certificate before dispatch."},{status:409});
  const minDays=body.daysMin!==undefined?Number(body.daysMin):Number(current.estimated_days_min);const maxDays=body.daysMax!==undefined?Number(body.daysMax):Number(current.estimated_days_max);
  if(!Number.isInteger(minDays)||!Number.isInteger(maxDays)||minDays<1||maxDays<minDays||maxDays>365)return NextResponse.json({error:"Check the production timeline."},{status:400});
  const patch:any={status,artist_notes:body.artistNotes!==undefined?String(body.artistNotes).slice(0,4000):current.artist_notes,estimated_days_min:minDays,estimated_days_max:maxDays,updated_at:new Date().toISOString()};
  if(["approved","awaiting_deposit","in_progress","drying","ready_to_ship","shipped","completed"].includes(status)){
   patch.final_price_eur=finalPrice;patch.deposit_amount_eur=Math.round(finalPrice*50)/100;patch.balance_amount_eur=Math.round((finalPrice-patch.deposit_amount_eur)*100)/100;
  }
  const {data:saved,error}=await db.from("petit_sot_commissions").update(patch).eq("id",id).select("*").single();if(error)throw error;
  const origin=new URL(request.url).origin;const paymentUrl=new URL("/commission/payment?ref="+encodeURIComponent(saved.reference_code)+(status==="ready_to_ship"?"&balance=1":""),origin).toString();
  let emailSent=false;const key=process.env.RESEND_API_KEY,from=process.env.CONTACT_FROM_EMAIL;
  if(key&&from&&status==="awaiting_deposit"){
   const email=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:[saved.customer_email],subject:"Your PETIT.SOT painting commission is ready for confirmation",text:["Hello "+saved.customer_name+",","","Olga has reviewed your custom painting request and approved the project.","","Reference: "+saved.reference_code,"Final price: €"+Number(saved.final_price_eur).toFixed(2),"50% deposit: €"+Number(saved.deposit_amount_eur).toFixed(2),"Remaining balance: €"+Number(saved.balance_amount_eur).toFixed(2),"Estimated production and initial drying: "+saved.estimated_days_min+"–"+saved.estimated_days_max+" days.","","To pay the 50% deposit securely with PayPal, open: "+paymentUrl,"","Thank you,","PETIT.SOT STUDIO"].join("\n")}),cache:"no-store"});
   emailSent=email.ok;
  }
  if(key&&from&&status==="ready_to_ship"&&!saved.balance_paid_at){
   const email=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:[saved.customer_email],subject:"Your PETIT.SOT painting is ready — final balance",text:["Hello "+saved.customer_name+",","","Your commissioned painting is finished and ready for dispatch.","","Reference: "+saved.reference_code,"Total price: €"+Number(saved.final_price_eur).toFixed(2),"Remaining balance: €"+Number(saved.balance_amount_eur).toFixed(2),"","To pay the remaining balance securely with PayPal, open: "+paymentUrl,"","Once the balance is received, we will arrange dispatch.","","Thank you,","PETIT.SOT STUDIO"].join("\n")}),cache:"no-store"});
   emailSent=email.ok;
  }
  return NextResponse.json({commission:saved,paymentUrl,emailSent});
 }catch(error:any){console.error("Commission update failed",error);return NextResponse.json({error:error?.message||"Could not update commission."},{status:500});}
}

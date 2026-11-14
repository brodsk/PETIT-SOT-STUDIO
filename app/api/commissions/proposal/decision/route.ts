import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {createAdminClient} from "../../../../../lib/supabase/admin";
import {sendStudioEmail} from "../../../../../lib/email/brand";
export const runtime="nodejs";
export async function GET(request:Request){try{
 const url=new URL(request.url),ref=String(url.searchParams.get("reference")||""),token=String(url.searchParams.get("token")||"");
 if(!/^PS-C-\d{4}-[A-Z0-9]{12}$/.test(ref)||!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:"Invalid proposal link."},{status:400});
 const hash=createHash("sha256").update(token).digest("hex"),db=createAdminClient();
 const {data:c,error}=await db.from("petit_sot_commissions").select("reference_code,width_cm,height_cm,description,artist_notes,final_price_eur,deposit_amount_eur,balance_amount_eur,estimated_days_min,estimated_days_max,customer_locale,proposal_version").eq("reference_code",ref).eq("proposal_token_hash",hash).eq("proposal_pending",true).maybeSingle();
 if(error)throw error;
 if(!c)return NextResponse.json({error:"This proposal link is invalid, expired or has already been used."},{status:404});
 return NextResponse.json({proposal:c});
 }catch(e:any){console.error("Proposal details lookup failed",e);return NextResponse.json({error:e?.message||"Could not load proposal."},{status:500});}}

export async function POST(request:Request){try{
 const body=await request.json(),ref=String(body.reference||""),token=String(body.token||""),decision=body.decision==="approve"?"approve":body.decision==="decline"?"decline":"";
 if(!/^PS-C-\d{4}-[A-Z0-9]{12}$/.test(ref)||!/^[a-f0-9]{64}$/.test(token)||!decision)return NextResponse.json({error:"Invalid approval link."},{status:400});
 const db=createAdminClient(),hash=createHash("sha256").update(token).digest("hex"),{data:c,error}=await db.from("petit_sot_commissions").select("*").eq("reference_code",ref).eq("proposal_token_hash",hash).eq("proposal_pending",true).maybeSingle();
 if(error||!c)return NextResponse.json({error:"This proposal link is invalid, expired or has already been used."},{status:404});
 const now=new Date().toISOString(),patch=decision==="approve"?{status:"awaiting_deposit",proposal_pending:false,proposal_token_hash:null,customer_approved_at:now,updated_at:now}:{status:"declined",proposal_pending:false,proposal_token_hash:null,updated_at:now};
 const {data:saved,error:updateError}=await db.from("petit_sot_commissions").update(patch).eq("id",c.id).eq("proposal_pending",true).select("*").maybeSingle();if(updateError)throw updateError;if(!saved)return NextResponse.json({error:"This proposal has already been processed."},{status:409});
 const ru=saved.customer_locale==="ru";
 if(decision==="approve"){
  const url=new URL((ru?"/ru":"")+"/commission/payment?ref="+encodeURIComponent(ref),new URL(request.url).origin).toString();
  await sendStudioEmail({
   to:saved.customer_email,
   subject:ru?"Подтверждение PETIT.SOT — предоплата 50%":"Your PETIT.SOT proposal is approved — 50% deposit",
   preheader:ru?"Спасибо! Теперь можно внести предоплату за картину.":"Thank you for approving the proposal. Your deposit is now ready.",
   title:ru?"Предложение подтверждено":"Your proposal is approved",
   greeting:(ru?"Здравствуйте, ":"Hello ")+saved.customer_name+"!",
   paragraphs:[ru?"Спасибо, что подтвердили условия заказа. Теперь можно безопасно внести предоплату 50%.":"Thank you for approving the final proposal. You can now securely pay the 50% deposit."],
   details:[
    {label:ru?"Номер заказа":"Reference",value:ref},
    {label:ru?"Стоимость":"Agreed total",value:"€"+Number(saved.final_price_eur).toFixed(2)},
    {label:ru?"Предоплата 50%":"50% deposit due now",value:"€"+Number(saved.deposit_amount_eur).toFixed(2)},
    {label:ru?"Остаток перед отправкой":"Remaining balance before dispatch",value:"€"+Number(saved.balance_amount_eur).toFixed(2)}
   ],
   buttonLabel:ru?"Перейти к оплате":"Pay 50% deposit",
   buttonUrl:url
  });
 }
 await sendStudioEmail({
  to:"manager@petitsot.com",
  subject:"Customer "+(decision==="approve"?"approved":"declined")+" proposal — "+ref,
  title:"Customer "+(decision==="approve"?"approved":"declined")+" a proposal",
  greeting:saved.customer_name+" · "+saved.customer_email,
  paragraphs:["Commission reference: "+ref,"Proposal version: "+saved.proposal_version],
  details:[{label:"Decision",value:decision},{label:"Reference",value:ref}]
 });
 return NextResponse.json({ok:true,decision,status:saved.status});
 }catch(e:any){console.error("Customer proposal decision failed",e);return NextResponse.json({error:e?.message||"Could not process your decision."},{status:500});}}

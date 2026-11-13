import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {createAdminClient} from "../../../../../lib/supabase/admin";
export const runtime="nodejs";
export async function POST(request:Request){try{
 const body=await request.json(),ref=String(body.reference||""),token=String(body.token||""),decision=body.decision==="approve"?"approve":body.decision==="decline"?"decline":"";
 if(!/^PS-C-\d{4}-[A-Z0-9]{12}$/.test(ref)||!/^[a-f0-9]{64}$/.test(token)||!decision)return NextResponse.json({error:"Invalid approval link."},{status:400});
 const db=createAdminClient(),hash=createHash("sha256").update(token).digest("hex"),{data:c,error}=await db.from("petit_sot_commissions").select("*").eq("reference_code",ref).eq("proposal_token_hash",hash).eq("proposal_pending",true).maybeSingle();
 if(error||!c)return NextResponse.json({error:"This proposal link is invalid, expired or has already been used."},{status:404});
 const now=new Date().toISOString(),patch=decision==="approve"?{status:"awaiting_deposit",proposal_pending:false,proposal_token_hash:null,customer_approved_at:now,updated_at:now}:{status:"declined",proposal_pending:false,proposal_token_hash:null,updated_at:now};
 const {data:saved,error:updateError}=await db.from("petit_sot_commissions").update(patch).eq("id",c.id).eq("proposal_pending",true).select("*").maybeSingle();if(updateError)throw updateError;if(!saved)return NextResponse.json({error:"This proposal has already been processed."},{status:409});
 const key=process.env.RESEND_API_KEY,from=process.env.CONTACT_FROM_EMAIL;if(key&&from){
  if(decision==="approve"){const url=new URL((saved.customer_locale==="ru"?"/ru":"")+"/commission/payment?ref="+encodeURIComponent(ref),new URL(request.url).origin).toString();await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:[saved.customer_email],subject:"Your PETIT.SOT proposal is approved — 50% deposit",text:["Hello "+saved.customer_name+",","Thank you for approving the final proposal.","","Reference: "+ref,"Agreed total: €"+Number(saved.final_price_eur).toFixed(2),"50% deposit due now: €"+Number(saved.deposit_amount_eur).toFixed(2),"Remaining balance before dispatch: €"+Number(saved.balance_amount_eur).toFixed(2),"","Pay your 50% deposit securely with PayPal or a debit/credit card: "+url,"","Здравствуйте! Вы подтвердили условия заказа. Предоплата 50%: €"+Number(saved.deposit_amount_eur).toFixed(2)+". Оплатить через PayPal или банковской картой: "+url,"","PETIT.SOT STUDIO"].join("\n")}),cache:"no-store"});}
  await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:["manager@petitsot.com"],subject:"Customer "+(decision==="approve"?"approved":"declined")+" proposal — "+ref,text:"Customer "+saved.customer_name+" ("+saved.customer_email+") "+(decision==="approve"?"approved":"declined")+" proposal version "+saved.proposal_version+" for "+ref+"."}),cache:"no-store"});
 }
 return NextResponse.json({ok:true,decision,status:saved.status});
 }catch(e:any){console.error("Customer proposal decision failed",e);return NextResponse.json({error:e?.message||"Could not process your decision."},{status:500});}}

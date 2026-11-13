import {NextResponse} from "next/server";
import {createHash,randomBytes} from "node:crypto";
import {createClient} from "../../../../../../lib/supabase/server";
import {createAdminClient} from "../../../../../../lib/supabase/admin";
import {sendStudioEmail} from "../../../../../../lib/email/brand";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const auth=await createClient(),{data:{user}}=await auth.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data:admin}=await auth.from("petit_sot_admins").select("user_id").eq("user_id",user.id).maybeSingle();if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await params,body=await request.json(),db=createAdminClient(),{data:c,error}=await db.from("petit_sot_commissions").select("*").eq("id",id).single();if(error||!c)return NextResponse.json({error:"Commission not found."},{status:404});
 if(c.deposit_paid_at)return NextResponse.json({error:"A proposal cannot be changed after the deposit has been paid."},{status:409});
 const price=Number(body.finalPrice),min=Number(body.daysMin),max=Number(body.daysMax),description=String(body.description??c.description).trim().slice(0,1800);
 if(!Number.isFinite(price)||price<100||price>50000||!Number.isInteger(min)||!Number.isInteger(max)||min<1||max<min||max>365||description.length<20)return NextResponse.json({error:"Check the proposed price, description and timeline."},{status:400});
 const token=randomBytes(32).toString("hex"),hash=createHash("sha256").update(token).digest("hex"),deposit=Math.round(price*50)/100;
 const {data:saved,error:updateError}=await db.from("petit_sot_commissions").update({status:"approved",description,final_price_eur:price,deposit_amount_eur:deposit,balance_amount_eur:Math.round((price-deposit)*100)/100,estimated_days_min:min,estimated_days_max:max,proposal_version:Number(c.proposal_version||0)+1,proposal_token_hash:hash,proposal_pending:true,proposal_sent_at:new Date().toISOString(),customer_approved_at:null,updated_at:new Date().toISOString()}).eq("id",id).select("*").single();if(updateError)throw updateError;
 const origin=new URL(request.url).origin,url=new URL((saved.customer_locale==="ru"?"/ru":"")+"/commission/approve?ref="+encodeURIComponent(saved.reference_code)+"&token="+token,origin).toString();
 const ru=saved.customer_locale==="ru";
 const emailSent=await sendStudioEmail({
  to:saved.customer_email,
  subject:(ru?"Обновлённое предложение PETIT.SOT — требуется подтверждение":"Updated PETIT.SOT painting proposal — your approval needed")+" — "+saved.reference_code,
  preheader:ru?"Ознакомьтесь с обновлёнными условиями заказа.":"Review the updated details of your commissioned painting.",
  title:ru?"Обновлённое предложение":"Your updated proposal",
  greeting:(ru?"Здравствуйте, ":"Hello ")+saved.customer_name+"!",
  paragraphs:[ru?"Ольга обновила предложение по вашей картине. Пожалуйста, ознакомьтесь с деталями и подтвердите условия.":"Olga has updated the proposal for your commissioned painting. Please review the details and confirm the terms."],
  details:[
   {label:ru?"Номер заказа":"Reference",value:saved.reference_code},
   {label:ru?"Размер":"Canvas",value:saved.width_cm+" × "+saved.height_cm+" cm"},
   {label:ru?"Стоимость":"Total price",value:"€"+price.toFixed(2)},
   {label:ru?"Предоплата 50%":"50% deposit",value:"€"+deposit.toFixed(2)},
   {label:ru?"Остаток перед отправкой":"Balance before dispatch",value:"€"+Number(saved.balance_amount_eur).toFixed(2)},
   {label:ru?"Срок изготовления":"Estimated timeline",value:min+"–"+max+" days"}
  ],
  buttonLabel:ru?"Посмотреть и подтвердить":"Review and approve",
  buttonUrl:url,
  footerNote:ru?"Оплата не требуется до подтверждения предложения.":"No payment is due until you approve this proposal."
 });
 if(!emailSent)return NextResponse.json({error:"Proposal saved, but the email could not be sent. Check the studio email configuration."},{status:502});
 return NextResponse.json({commission:saved,emailSent:true});
 }catch(e:any){console.error("Proposal send failed",e);return NextResponse.json({error:e?.message||"Could not send proposal."},{status:500});}}

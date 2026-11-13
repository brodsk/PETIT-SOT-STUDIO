import {NextResponse} from "next/server";
import {createHash,randomBytes} from "node:crypto";
import {createClient} from "../../../../../lib/supabase/server";
import {createAdminClient} from "../../../../../lib/supabase/admin";
import {sendStudioEmail} from "../../../../../lib/email/brand";
export const runtime="nodejs";
const allowed=new Set(["new","reviewing","approved","awaiting_deposit","in_progress","drying","ready_to_ship","shipped","completed","declined","cancelled"]);
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const auth=await createClient(),{data:{user}}=await auth.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data:adminRow}=await auth.from("petit_sot_admins").select("user_id").eq("user_id",user.id).maybeSingle();if(!adminRow)return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await params,body=await request.json(),db=createAdminClient(),{data:current,error:readError}=await db.from("petit_sot_commissions").select("*").eq("id",id).single();if(readError||!current)return NextResponse.json({error:"Commission not found."},{status:404});
 const status=body.status?String(body.status):current.status;if(!allowed.has(status))return NextResponse.json({error:"Invalid status."},{status:400});if(status==="awaiting_deposit"&&!current.customer_approved_at)return NextResponse.json({error:"The customer must approve the latest proposal before the deposit can be requested."},{status:409});
 const finalPrice=body.finalPrice!==undefined?Number(body.finalPrice):Number(current.final_price_eur??current.estimated_price_eur);
 if((body.sendProposal||status==="approved"||status==="awaiting_deposit")&&(!Number.isFinite(finalPrice)||finalPrice<100||finalPrice>50000))return NextResponse.json({error:"Set a valid final price before sending the proposal."},{status:400});
 if(current.deposit_paid_at&&Math.abs(finalPrice-Number(current.final_price_eur))>.001)return NextResponse.json({error:"The final price cannot be changed after the deposit has been paid."},{status:409});
 if(["in_progress","drying","ready_to_ship","shipped","completed"].includes(status)&&!current.deposit_paid_at)return NextResponse.json({error:"The 50% deposit must be paid before production can begin."},{status:409});
 if(["shipped","completed"].includes(status)&&Number(current.balance_amount_eur)>0&&!current.balance_paid_at)return NextResponse.json({error:"The remaining balance must be paid before dispatch or completion."},{status:409});
 if(status==="ready_to_ship"&&(!current.final_image_path||!current.final_artwork_title))return NextResponse.json({error:"Upload the finished painting and its English title first."},{status:409});
 if(["shipped","completed"].includes(status)&&!current.certificate_number)return NextResponse.json({error:"Generate the authenticity certificate before dispatch."},{status:409});
 const minDays=body.daysMin!==undefined?Number(body.daysMin):Number(current.estimated_days_min),maxDays=body.daysMax!==undefined?Number(body.daysMax):Number(current.estimated_days_max);
 if(!Number.isInteger(minDays)||!Number.isInteger(maxDays)||minDays<1||maxDays<minDays||maxDays>365)return NextResponse.json({error:"Check the production timeline."},{status:400});
 const patch:any={status:body.sendProposal?"approved":status,artist_notes:body.artistNotes!==undefined?String(body.artistNotes).slice(0,4000):current.artist_notes,estimated_days_min:minDays,estimated_days_max:maxDays,updated_at:new Date().toISOString()};
 if(body.description!==undefined)patch.description=String(body.description).trim().slice(0,1800);
 if(body.sendProposal||["approved","awaiting_deposit","in_progress","drying","ready_to_ship","shipped","completed"].includes(status)){patch.final_price_eur=finalPrice;patch.deposit_amount_eur=Math.round(finalPrice*50)/100;patch.balance_amount_eur=Math.round((finalPrice-patch.deposit_amount_eur)*100)/100;}
 let proposalToken:string|undefined;
 if(body.sendProposal){proposalToken=randomBytes(32).toString("hex");patch.proposal_version=Number(current.proposal_version||0)+1;patch.proposal_token_hash=createHash("sha256").update(proposalToken).digest("hex");patch.proposal_pending=true;patch.proposal_sent_at=new Date().toISOString();patch.customer_approved_at=null;}
 const {data:saved,error}=await db.from("petit_sot_commissions").update(patch).eq("id",id).select("*").single();if(error)throw error;
 let emailSent=false;
 const origin=new URL(request.url).origin;
 if(body.sendProposal){
  const approvalUrl=new URL((saved.customer_locale==="ru"?"/ru":"")+"/commission/approve?ref="+encodeURIComponent(saved.reference_code)+"&token="+proposalToken,origin).toString();
  emailSent=await sendStudioEmail({
   to:saved.customer_email,
   subject:(saved.customer_locale==="ru"?"Предложение вашей картины PETIT.SOT — требуется подтверждение":"Please approve your PETIT.SOT painting proposal")+" — "+saved.reference_code,
   preheader:saved.customer_locale==="ru"?"Ознакомьтесь с предложением Ольги и подтвердите условия.":"Review Olga's proposal and approve the details.",
   title:saved.customer_locale==="ru"?"Предложение вашей картины готово":"Your painting proposal is ready",
   greeting:(saved.customer_locale==="ru"?"Здравствуйте, ":"Hello ")+saved.customer_name+"!",
   paragraphs:[saved.customer_locale==="ru"?"Ольга подготовила индивидуальное предложение по вашей картине. Оплата потребуется только после вашего подтверждения.":"Olga has prepared a personal proposal for your commissioned painting. No payment is due until you approve the terms."],
   details:[
    {label:saved.customer_locale==="ru"?"Номер заказа":"Reference",value:saved.reference_code},
    {label:saved.customer_locale==="ru"?"Размер":"Canvas",value:saved.width_cm+" × "+saved.height_cm+" cm"},
    {label:saved.customer_locale==="ru"?"Стоимость":"Total price",value:"€"+Number(saved.final_price_eur).toFixed(2)},
    {label:saved.customer_locale==="ru"?"Предоплата 50%":"50% deposit",value:"€"+Number(saved.deposit_amount_eur).toFixed(2)},
    {label:saved.customer_locale==="ru"?"Остаток перед отправкой":"Balance before dispatch",value:"€"+Number(saved.balance_amount_eur).toFixed(2)},
    {label:saved.customer_locale==="ru"?"Срок изготовления":"Estimated timeline",value:saved.estimated_days_min+"–"+saved.estimated_days_max+" days"}
   ],
   buttonLabel:saved.customer_locale==="ru"?"Посмотреть предложение":"Review proposal",
   buttonUrl:approvalUrl,
   footerNote:saved.customer_locale==="ru"?"Если у вас возникнут вопросы, ответьте на это письмо.":"If you have any questions, simply reply to this email."
  });
 }
 const paymentUrl=new URL("/commission/payment?ref="+encodeURIComponent(saved.reference_code)+(status==="ready_to_ship"?"&balance=1":""),origin).toString();
 if(status==="ready_to_ship"&&!saved.balance_paid_at){
  const sent=await sendStudioEmail({
   to:saved.customer_email,
   subject:(saved.customer_locale==="ru"?"Ваша картина PETIT.SOT готова":"Your PETIT.SOT painting is ready")+" — "+saved.reference_code,
   preheader:saved.customer_locale==="ru"?"Осталось оплатить финальную часть заказа.":"Your painting is complete. The remaining balance is now due.",
   title:saved.customer_locale==="ru"?"Ваша картина готова":"Your painting is ready",
   greeting:(saved.customer_locale==="ru"?"Здравствуйте, ":"Hello ")+saved.customer_name+"!",
   paragraphs:[saved.customer_locale==="ru"?"Работа завершена и готова к отправке. Пожалуйста, оплатите оставшуюся часть заказа.":"Your painting is finished and ready for dispatch. Please complete the remaining balance so the studio can arrange shipment."],
   details:[
    {label:saved.customer_locale==="ru"?"Номер заказа":"Reference",value:saved.reference_code},
    {label:saved.customer_locale==="ru"?"Общая стоимость":"Total price",value:"€"+Number(saved.final_price_eur).toFixed(2)},
    {label:saved.customer_locale==="ru"?"Остаток к оплате":"Remaining balance",value:"€"+Number(saved.balance_amount_eur).toFixed(2)}
   ],
   buttonLabel:saved.customer_locale==="ru"?"Оплатить остаток":"Pay remaining balance",
   buttonUrl:paymentUrl
  });
  emailSent=sent||emailSent;
 }
 return NextResponse.json({commission:saved,paymentUrl,emailSent,proposalPending:Boolean(body.sendProposal)});
 }catch(e:any){console.error("Commission update failed",e);return NextResponse.json({error:e?.message||"Could not update commission."},{status:500});}}

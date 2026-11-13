import {NextResponse} from "next/server";
import {createHash,randomBytes} from "node:crypto";
import {createClient} from "../../../../../../lib/supabase/server";
import {createAdminClient} from "../../../../../../lib/supabase/admin";
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
 const from=process.env.CONTACT_FROM_EMAIL,key=process.env.RESEND_API_KEY;if(!from||!key)return NextResponse.json({error:"Email is not configured. The proposal was saved but could not be sent; configure Resend and retry."},{status:503});
 const origin=new URL(request.url).origin,url=new URL("/commission/approve?ref="+encodeURIComponent(saved.reference_code)+"&token="+token,origin).toString();
 const text=["Hello "+saved.customer_name+",","", "Olga has prepared or updated your PETIT.SOT painting proposal.","","Reference: "+saved.reference_code,"Description: "+saved.description,"Canvas: "+saved.width_cm+" × "+saved.height_cm+" cm","Final price: €"+price.toFixed(2),"50% deposit after your approval: €"+deposit.toFixed(2),"Remaining 50% before dispatch: €"+Number(saved.balance_amount_eur).toFixed(2),"Estimated production and initial drying: "+min+"–"+max+" days.","","Review and approve or decline: "+url,"No payment is due until you approve these terms.","","Здравствуйте! Ольга подготовила или обновила предложение по вашей картине.","Стоимость: €"+price.toFixed(2)+". Предоплата после подтверждения: €"+deposit.toFixed(2)+". Срок: "+min+"–"+max+" дней.","Посмотреть и подтвердить изменения: "+url,"","PETIT.SOT STUDIO"].join("\n");
 const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:[saved.customer_email],subject:"Updated PETIT.SOT painting proposal — your approval needed",text}),cache:"no-store"});
 if(!sent.ok)return NextResponse.json({error:"Proposal saved, but the email provider rejected delivery."},{status:502});
 return NextResponse.json({commission:saved,emailSent:true});
 }catch(e:any){console.error("Proposal send failed",e);return NextResponse.json({error:e?.message||"Could not send proposal."},{status:500});}}

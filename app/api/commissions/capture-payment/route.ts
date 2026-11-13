import {NextResponse} from "next/server";
import {createAdminClient} from "../../../../lib/supabase/admin";
export const runtime="nodejs";
function base(){return process.env.PAYPAL_ENVIRONMENT==="live"?"https://api-m.paypal.com":"https://api-m.sandbox.paypal.com";}
async function token(){const id=process.env.PAYPAL_CLIENT_ID,secret=process.env.PAYPAL_CLIENT_SECRET;if(!id||!secret)throw new Error("PayPal is not configured.");const r=await fetch(base()+"/v1/oauth2/token",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(id+":"+secret).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials",cache:"no-store"});if(!r.ok)throw new Error("PayPal authentication failed.");return (await r.json()).access_token as string;}
export async function POST(request:Request){
 try{
  const body=await request.json();const orderId=String(body?.orderId||"").trim();const reference=String(body?.reference||"").trim();
  if(!/^[A-Z0-9]+$/i.test(orderId)||!/^PS-C-\d{4}-[A-Z0-9]{12}$/.test(reference))return NextResponse.json({error:"Invalid payment reference."},{status:400});
  const admin=createAdminClient();const {data:commission,error}=await admin.from("petit_sot_commissions").select("id,reference_code,status,deposit_amount_eur,paypal_order_id,customer_email").eq("reference_code",reference).single();
  if(error||!commission)return NextResponse.json({error:"Commission not found."},{status:404});
  if(commission.status==="deposit_paid")return NextResponse.json({status:"COMPLETED",reference});
  if(commission.paypal_order_id&&commission.paypal_order_id!==orderId)return NextResponse.json({error:"Payment order does not match this commission."},{status:409});
  const access=await token();
  const check=await fetch(base()+"/v2/checkout/orders/"+encodeURIComponent(orderId),{headers:{Authorization:"Bearer "+access},cache:"no-store"});
  const order=await check.json();if(!check.ok)return NextResponse.json({error:"Could not verify the PayPal order."},{status:400});
  const unit=order.purchase_units?.[0];const actualReference=unit?.custom_id||unit?.reference_id;const amount=Number(unit?.amount?.value);const expected=Number(commission.deposit_amount_eur);
  if(actualReference!==reference||unit?.amount?.currency_code!=="EUR"||!Number.isFinite(amount)||Math.abs(amount-expected)>.001)return NextResponse.json({error:"Payment details do not match this commission."},{status:409});
  if(order.status==="COMPLETED"){
    await admin.from("petit_sot_commissions").update({status:"deposit_paid",paypal_order_id:orderId,paypal_capture_id:unit?.payments?.captures?.[0]?.id||null,deposit_paid_at:new Date().toISOString()}).eq("id",commission.id);
    return NextResponse.json({status:"COMPLETED",reference});
  }
  if(order.status!=="APPROVED")return NextResponse.json({error:"PayPal payment has not been approved."},{status:409});
  const captured=await fetch(base()+"/v2/checkout/orders/"+encodeURIComponent(orderId)+"/capture",{method:"POST",headers:{Authorization:"Bearer "+access,"Content-Type":"application/json","PayPal-Request-Id":"capture-"+orderId},body:"{}",cache:"no-store"});
  const result=await captured.json();if(!captured.ok||result.status!=="COMPLETED"){console.error("Commission capture failed",captured.status,result?.name);return NextResponse.json({error:"PayPal could not complete the payment."},{status:502});}
  const captureId=result.purchase_units?.[0]?.payments?.captures?.[0]?.id||null;
  const {error:updateError}=await admin.from("petit_sot_commissions").update({status:"deposit_paid",paypal_order_id:orderId,paypal_capture_id:captureId,deposit_paid_at:new Date().toISOString()}).eq("id",commission.id);
  if(updateError)throw updateError;
  const resend=process.env.RESEND_API_KEY,from=process.env.CONTACT_FROM_EMAIL;
  if(resend&&from){
   await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+resend,"Content-Type":"application/json"},body:JSON.stringify({from,to:["manager@petitsot.com"],subject:"Commission deposit paid — "+reference,text:"The 50% deposit has been paid for commission "+reference+". PayPal order: "+orderId+". Capture: "+(captureId||"—")}),cache:"no-store"}).catch(()=>{});
   await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+resend,"Content-Type":"application/json"},body:JSON.stringify({from,to:[commission.customer_email],subject:"Your PETIT.SOT commission deposit is confirmed",text:"Hello,\n\nYour 50% deposit for commission "+reference+" has been received successfully. Olga will now schedule the painting.\n\nThank you,\nPETIT.SOT STUDIO"}),cache:"no-store"}).catch(()=>{});
  }
  return NextResponse.json({status:"COMPLETED",reference});
 }catch(error:any){console.error("Commission capture failed",error);return NextResponse.json({error:error?.message||"Could not confirm payment."},{status:503});}
}

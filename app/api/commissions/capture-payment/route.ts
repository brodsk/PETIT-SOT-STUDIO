import {NextResponse} from "next/server";
import {createAdminClient} from "../../../../lib/supabase/admin";
export const runtime="nodejs";
function base(){return process.env.PAYPAL_ENVIRONMENT==="live"?"https://api-m.paypal.com":"https://api-m.sandbox.paypal.com";}
async function token(){const id=process.env.PAYPAL_CLIENT_ID,secret=process.env.PAYPAL_CLIENT_SECRET;if(!id||!secret)throw new Error("PayPal is not configured.");const r=await fetch(base()+"/v1/oauth2/token",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(id+":"+secret).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials",cache:"no-store"});if(!r.ok)throw new Error("PayPal authentication failed.");return (await r.json()).access_token as string;}
export async function POST(request:Request){
 try{
  const body=await request.json();const orderId=String(body?.orderId||"").trim();const reference=String(body?.reference||"").trim();const type=body?.type==="balance"?"balance":"deposit";
  if(!/^[A-Z0-9]+$/i.test(orderId)||!/^PS-C-\d{4}-[A-Z0-9]{12}$/.test(reference))return NextResponse.json({error:"Invalid payment reference."},{status:400});
  const db=createAdminClient();const {data:c,error}=await db.from("petit_sot_commissions").select("id,reference_code,status,deposit_amount_eur,balance_amount_eur,deposit_paid_at,balance_paid_at,paypal_order_id,balance_paypal_order_id,customer_email").eq("reference_code",reference).single();
  if(error||!c)return NextResponse.json({error:"Commission not found."},{status:404});
  if(type==="deposit"&&c.deposit_paid_at)return NextResponse.json({status:"COMPLETED",reference,type});
  if(type==="balance"&&c.balance_paid_at)return NextResponse.json({status:"COMPLETED",reference,type});
  const expected=type==="balance"?Number(c.balance_amount_eur):Number(c.deposit_amount_eur);
  const savedOrder=type==="balance"?c.balance_paypal_order_id:c.paypal_order_id;
  if(savedOrder&&savedOrder!==orderId)return NextResponse.json({error:"Payment order does not match this commission."},{status:409});
  if(type==="balance"&&(!c.deposit_paid_at||c.status!=="ready_to_ship"))return NextResponse.json({error:"The remaining balance is not due yet."},{status:409});
  const access=await token();const check=await fetch(base()+"/v2/checkout/orders/"+encodeURIComponent(orderId),{headers:{Authorization:"Bearer "+access},cache:"no-store"});
  const order=await check.json();if(!check.ok)return NextResponse.json({error:"Could not verify the PayPal order."},{status:400});
  const unit=order.purchase_units?.[0];const actualReference=unit?.custom_id||unit?.reference_id;const amount=Number(unit?.amount?.value);
  if(actualReference!==reference||unit?.amount?.currency_code!=="EUR"||!Number.isFinite(amount)||Math.abs(amount-expected)>.001)return NextResponse.json({error:"Payment details do not match this commission."},{status:409});
  let captureId=unit?.payments?.captures?.[0]?.id||null;
  if(order.status!=="COMPLETED"){
   if(order.status!=="APPROVED")return NextResponse.json({error:"PayPal payment has not been approved."},{status:409});
   const captured=await fetch(base()+"/v2/checkout/orders/"+encodeURIComponent(orderId)+"/capture",{method:"POST",headers:{Authorization:"Bearer "+access,"Content-Type":"application/json","PayPal-Request-Id":"capture-"+orderId},body:"{}",cache:"no-store"});
   const result=await captured.json();if(!captured.ok||result.status!=="COMPLETED"){console.error("Commission capture failed",captured.status,result?.name);return NextResponse.json({error:"PayPal could not complete the payment."},{status:502});}
   captureId=result.purchase_units?.[0]?.payments?.captures?.[0]?.id||null;
  }
  const now=new Date().toISOString();
  const patch=type==="balance"?{balance_paypal_order_id:orderId,balance_paypal_capture_id:captureId,balance_paid_at:now}:{status:"deposit_paid",paypal_order_id:orderId,paypal_capture_id:captureId,deposit_paid_at:now};
  const {error:updateError}=await db.from("petit_sot_commissions").update(patch).eq("id",c.id);if(updateError)throw updateError;
  const resend=process.env.RESEND_API_KEY,from=process.env.CONTACT_FROM_EMAIL;
  if(resend&&from){
   const label=type==="balance"?"remaining balance":"50% deposit";
   const emailText="Your "+label+" for commission "+reference+" has been received successfully. "+(type==="balance"?"The painting is ready for dispatch; the studio will arrange shipment.":"Olga will now schedule the painting.")+"\n\nThank you,\nPETIT.SOT STUDIO";
   await Promise.allSettled([
    fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+resend,"Content-Type":"application/json"},body:JSON.stringify({from,to:["manager@petitsot.com"],subject:"Commission "+label+" paid — "+reference,text:"The "+label+" has been paid for commission "+reference+". PayPal order: "+orderId+". Capture: "+(captureId||"—")}),cache:"no-store"}),
    fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+resend,"Content-Type":"application/json"},body:JSON.stringify({from,to:[c.customer_email],subject:"Your PETIT.SOT commission payment is confirmed",text:"Hello,\n\n"+emailText}),cache:"no-store"})
   ]);
  }
  return NextResponse.json({status:"COMPLETED",reference,type});
 }catch(error:any){console.error("Commission capture failed",error);return NextResponse.json({error:error?.message||"Could not confirm payment."},{status:503});}
}

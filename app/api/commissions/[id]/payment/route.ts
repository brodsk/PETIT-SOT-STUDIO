import {NextResponse} from "next/server";
import {createAdminClient} from "../../../../../lib/supabase/admin";
export const runtime="nodejs";
function base(){return process.env.PAYPAL_ENVIRONMENT==="live"?"https://api-m.paypal.com":"https://api-m.sandbox.paypal.com";}
async function token(){const id=process.env.PAYPAL_CLIENT_ID,secret=process.env.PAYPAL_CLIENT_SECRET;if(!id||!secret)throw new Error("PayPal is not configured.");const r=await fetch(base()+"/v1/oauth2/token",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(id+":"+secret).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials",cache:"no-store"});if(!r.ok)throw new Error("PayPal authentication failed.");return (await r.json()).access_token as string;}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id:reference}=await params;const body=await request.json().catch(()=>({}));const type=body?.type==="balance"?"balance":"deposit";
  const db=createAdminClient();const {data:c,error}=await db.from("petit_sot_commissions").select("id,reference_code,status,deposit_amount_eur,balance_amount_eur,deposit_paid_at,balance_paid_at,paypal_order_id,balance_paypal_order_id").eq("reference_code",reference).single();
  if(error||!c)return NextResponse.json({error:"Commission not found."},{status:404});
  const amount=type==="balance"?Number(c.balance_amount_eur):Number(c.deposit_amount_eur);
  if(type==="deposit"){
   if(c.deposit_paid_at||c.status==="deposit_paid")return NextResponse.json({error:"The deposit has already been paid."},{status:409});
   if(!["approved","awaiting_deposit"].includes(c.status)||!amount)return NextResponse.json({error:"This commission is not ready for deposit payment."},{status:409});
  }else{
   if(c.balance_paid_at)return NextResponse.json({error:"The remaining balance has already been paid."},{status:409});
   if(c.status!=="ready_to_ship"||!c.deposit_paid_at||!amount)return NextResponse.json({error:"The final balance is not ready for payment yet."},{status:409});
  }
  const access=await token();const origin=new URL(request.url).origin;const query="ref="+encodeURIComponent(c.reference_code)+(type==="balance"?"&balance=1":"");
  const description=(type==="balance"?"Remaining 50% balance":"50% deposit")+" — custom painting "+c.reference_code;
  const response=await fetch(base()+"/v2/checkout/orders",{method:"POST",headers:{Authorization:"Bearer "+access,"Content-Type":"application/json","PayPal-Request-Id":"commission-"+type+"-"+c.reference_code+"-"+crypto.randomUUID()},body:JSON.stringify({
   intent:"CAPTURE",purchase_units:[{reference_id:c.reference_code,custom_id:c.reference_code,description,amount:{currency_code:"EUR",value:amount.toFixed(2)}}],
   application_context:{brand_name:"PETIT.SOT STUDIO",user_action:"PAY_NOW",return_url:origin+"/commission/payment?"+query,cancel_url:origin+"/commission/payment?"+query+"&cancel=1"}
  }),cache:"no-store"});
  const order=await response.json();if(!response.ok){console.error("Commission PayPal order failed",response.status,order?.name);return NextResponse.json({error:"Could not start PayPal checkout."},{status:502});}
  const approveUrl=order.links?.find((x:{rel?:string})=>x.rel==="approve")?.href;if(!order.id||!approveUrl)return NextResponse.json({error:"PayPal did not return an approval link."},{status:502});
  const patch=type==="balance"?{balance_paypal_order_id:order.id}:{paypal_order_id:order.id};
  const {error:updateError}=await db.from("petit_sot_commissions").update(patch).eq("id",c.id);if(updateError)throw updateError;
  return NextResponse.json({orderId:order.id,approveUrl});
 }catch(error:any){console.error("Commission payment creation failed",error);return NextResponse.json({error:error?.message||"Payment service unavailable."},{status:503});}
}

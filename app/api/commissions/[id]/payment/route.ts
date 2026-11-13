import {NextResponse} from "next/server";
import {createAdminClient} from "../../../../../lib/supabase/admin";
export const runtime="nodejs";
function base(){return process.env.PAYPAL_ENVIRONMENT==="live"?"https://api-m.paypal.com":"https://api-m.sandbox.paypal.com";}
async function token(){const id=process.env.PAYPAL_CLIENT_ID,secret=process.env.PAYPAL_CLIENT_SECRET;if(!id||!secret)throw new Error("PayPal is not configured.");const r=await fetch(base()+"/v1/oauth2/token",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(id+":"+secret).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials",cache:"no-store"});if(!r.ok)throw new Error("PayPal authentication failed.");return (await r.json()).access_token as string;}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id:reference}=await params;const admin=createAdminClient();
  const {data:commission,error}=await admin.from("petit_sot_commissions").select("id,reference_code,status,deposit_amount_eur,customer_name").eq("reference_code",reference).single();
  if(error||!commission)return NextResponse.json({error:"Commission not found."},{status:404});
  if(commission.status==="deposit_paid")return NextResponse.json({error:"The deposit has already been paid."},{status:409});
  if(!["approved","awaiting_deposit"].includes(commission.status)||!Number(commission.deposit_amount_eur))return NextResponse.json({error:"This commission is not ready for payment yet."},{status:409});
  const access=await token();const origin=new URL(request.url).origin;
  const response=await fetch(base()+"/v2/checkout/orders",{method:"POST",headers:{Authorization:"Bearer "+access,"Content-Type":"application/json","PayPal-Request-Id":"commission-"+commission.reference_code+"-"+crypto.randomUUID()},body:JSON.stringify({
   intent:"CAPTURE",
   purchase_units:[{reference_id:commission.reference_code,custom_id:commission.reference_code,description:"50% deposit — custom painting "+commission.reference_code,amount:{currency_code:"EUR",value:Number(commission.deposit_amount_eur).toFixed(2)}}],
   application_context:{brand_name:"PETIT.SOT STUDIO",user_action:"PAY_NOW",return_url:origin+"/commission/payment?ref="+encodeURIComponent(commission.reference_code),cancel_url:origin+"/commission/payment?ref="+encodeURIComponent(commission.reference_code)+"&cancel=1"}
  }),cache:"no-store"});
  const order=await response.json();if(!response.ok){console.error("Commission PayPal order failed",response.status,order?.name);return NextResponse.json({error:"Could not start PayPal checkout."},{status:502});}
  const approveUrl=order.links?.find((x:{rel?:string})=>x.rel==="approve")?.href;if(!order.id||!approveUrl)return NextResponse.json({error:"PayPal did not return an approval link."},{status:502});
  await admin.from("petit_sot_commissions").update({paypal_order_id:order.id}).eq("id",commission.id);
  return NextResponse.json({orderId:order.id,approveUrl});
 }catch(error:any){console.error("Commission payment creation failed",error);return NextResponse.json({error:error?.message||"Payment service unavailable."},{status:503});}
}

import {NextResponse} from "next/server";
import {createAdminClient} from "../../../../../../lib/supabase/admin";
export const runtime="nodejs";
function base(){return process.env.PAYPAL_ENVIRONMENT==="live"?"https://api-m.paypal.com":"https://api-m.sandbox.paypal.com";}
async function accessToken(){const id=process.env.PAYPAL_CLIENT_ID,secret=process.env.PAYPAL_CLIENT_SECRET;if(!id||!secret)throw new Error("PayPal is not configured.");const r=await fetch(base()+"/v1/oauth2/token",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(id+":"+secret).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials",cache:"no-store"});if(!r.ok)throw new Error("PayPal authentication failed.");return (await r.json()).access_token as string;}
export async function POST(request:Request,{params}:{params:Promise<{reference:string}>}){try{
 const {reference}=await params,body=await request.json(),type=body?.type==="balance"?"balance":"deposit",paymentMethod=body?.paymentMethod==="cardfields"?"cardfields":"paypal";
 if(!/^PS-C-\\d{4}-[A-Z0-9]{12}$/.test(reference))return NextResponse.json({error:"Invalid commission reference."},{status:400});
 const db=createAdminClient(),{data:c,error}=await db.from("petit_sot_commissions").select("id,reference_code,status,customer_locale,customer_approved_at,deposit_amount_eur,balance_amount_eur,deposit_paid_at,balance_paid_at,paypal_order_id,balance_paypal_order_id").eq("reference_code",reference).maybeSingle();
 if(error||!c)return NextResponse.json({error:"Commission not found."},{status:404});
 if(type==="deposit"&&(!c.customer_approved_at||!["awaiting_deposit","approved"].includes(c.status)||c.deposit_paid_at))return NextResponse.json({error:"The customer must approve the latest proposal before paying the deposit."},{status:409});
 if(type==="balance"&&(!c.deposit_paid_at||c.status!=="ready_to_ship"||c.balance_paid_at))return NextResponse.json({error:"The remaining balance is not due yet."},{status:409});
 const amount=Number(type==="balance"?c.balance_amount_eur:c.deposit_amount_eur);if(!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:"Invalid payment amount."},{status:409});
 const access=await accessToken(),origin=new URL(request.url).origin,locale=c.customer_locale==="ru"?"ru":"en",page=(locale==="ru"?"/ru":"")+"/commission/payment?ref="+encodeURIComponent(reference)+(type==="balance"?"&balance=1":"");
 const response=await fetch(base()+"/v2/checkout/orders",{method:"POST",headers:{Authorization:"Bearer "+access,"Content-Type":"application/json","PayPal-Request-Id":crypto.randomUUID()},body:JSON.stringify({intent:"CAPTURE",purchase_units:[{reference_id:reference,custom_id:reference,description:(type==="balance"?"PETIT.SOT commission balance ":"PETIT.SOT 50% commission deposit ")+reference,amount:{currency_code:"EUR",value:amount.toFixed(2)}}],...(paymentMethod==="cardfields"?{payment_source:{card:{attributes:{verification:{method:"SCA_WHEN_REQUIRED"}}}}}:{}),application_context:{brand_name:"PETIT.SOT STUDIO",user_action:"PAY_NOW",return_url:origin+page,cancel_url:origin+page+"&cancel=1"}}),cache:"no-store"});
 const order=await response.json();if(!response.ok||!order.id){console.error("Commission PayPal order failed",response.status,order?.name);return NextResponse.json({error:"Could not start secure payment."},{status:502});}
 const orderLink=order.links?.find((x:{rel?:string})=>x.rel==="approve")?.href;
 const patch=type==="balance"?{balance_paypal_order_id:order.id}:{paypal_order_id:order.id};const {error:updateError}=await db.from("petit_sot_commissions").update(patch).eq("id",c.id);if(updateError)throw updateError;
 return NextResponse.json({orderId:order.id,...(orderLink?{approveUrl:orderLink}:{})});
 }catch(e:any){console.error("Commission payment creation failed",e);return NextResponse.json({error:e?.message||"Could not start payment."},{status:503});}}

import {createAdminClient} from "../../../../lib/supabase/admin";
import CommissionPayment from "./CommissionPayment";
export const dynamic="force-dynamic";
export const metadata={title:"Commission Deposit | PETIT.SOT STUDIO",robots:{index:false,follow:false}};
export default async function CommissionPaymentPage({searchParams}:{searchParams:Promise<{ref?:string;token?:string;cancel?:string;balance?:string}>}){
 const params=await searchParams;const reference=String(params.ref||"");let commission:any=null;
 if(/^PS-C-\d{4}-[A-Z0-9]{12}$/.test(reference)){
  const db=createAdminClient();const {data}=await db.from("petit_sot_commissions").select("reference_code,status,customer_name,customer_locale,deposit_amount_eur,balance_amount_eur,final_price_eur,estimated_days_min,estimated_days_max,deposit_paid_at,balance_paid_at,customer_approved_at").eq("reference_code",reference).maybeSingle();commission=data;
 }
 return <CommissionPayment commission={commission} reference={reference} token={String(params.token||"")} cancelled={params.cancel==="1"} balanceMode={params.balance==="1"}/>;
}

import { requireAdmin } from "../../../lib/admin";
import PrintsAdmin from "./PrintsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPrintsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: artworks }, { data: variants }, { data: orders }] = await Promise.all([
    supabase.from("petit_sot_artworks").select("id,slug,title,width_cm,height_cm,status").order("created_at", { ascending: false }),
    supabase.from("petit_sot_print_variants").select("*").order("created_at", { ascending: false }),
    supabase.from("petit_sot_print_orders").select("id,prodigi_order_id,paypal_order_id,status_stage,paid_amount_eur,recipient,created_at,submitted_to_prodigi_at,fulfillment_error").order("created_at", { ascending: false }).limit(50),
  ]);
  return <PrintsAdmin artworks={artworks ?? []} initialVariants={variants ?? []} initialOrders={orders ?? []} />;
}

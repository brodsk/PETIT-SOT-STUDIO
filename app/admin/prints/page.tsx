import { requireAdmin } from "../../../lib/admin";
import PrintsAdmin from "./PrintsAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPrintsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: artworks }, { data: variants }] = await Promise.all([
    supabase.from("petit_sot_artworks").select("id,slug,title,width_cm,height_cm,status").order("created_at", { ascending: false }),
    supabase.from("petit_sot_print_variants").select("*").order("created_at", { ascending: false }),
  ]);
  return <PrintsAdmin artworks={artworks ?? []} initialVariants={variants ?? []} />;
}

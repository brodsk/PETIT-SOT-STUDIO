import AdminDashboard from "./dashboard";
import { requireAdmin } from "../../lib/admin";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const { data: artworks } = await supabase.from("petit_sot_artworks").select("*").order("created_at",{ascending:false});
  return <AdminDashboard initialArtworks={artworks ?? []}/>;
}

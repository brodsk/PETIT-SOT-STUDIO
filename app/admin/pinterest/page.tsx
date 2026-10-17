import PinterestDashboard from "./dashboard";
import { requireAdmin } from "../../../lib/admin";

export default async function PinterestAdminPage() {
  await requireAdmin();
  return <PinterestDashboard />;
}

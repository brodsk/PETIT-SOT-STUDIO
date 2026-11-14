import { requireAdmin } from "../../../lib/admin";
import { getZohoConnection } from "../../../lib/zoho-mail";
import MailAdmin from "./mail-admin";

export const dynamic="force-dynamic";

export default async function AdminMailPage() {
  await requireAdmin();
  const connection=await getZohoConnection();
  return <MailAdmin initialConnected={Boolean(connection?.account_id)} initialEmail={connection?.account_email||null}/>;
}

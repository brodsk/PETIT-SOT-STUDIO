import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) redirect("/admin/login?error=invalid");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) redirect("/admin/login?error=invalid");

  const { data: admin } = await supabase
    .from("petit_sot_admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }

  redirect("/admin");
}

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message =
    error === "invalid" ? "Invalid email or password." :
    error === "not-admin" ? "This account is not an administrator." : "";

  return <main className="admin-login">
    <div className="admin-login-card">
      <p className="eyebrow">PETIT.SOT / ADMIN</p>
      <h1>Private<br/><em>archive.</em></h1>
      <form action={signIn}>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        {message && <p className="admin-error">{message}</p>}
        <button type="submit">Sign in <span>↗</span></button>
      </form>
    </div>
  </main>;
}

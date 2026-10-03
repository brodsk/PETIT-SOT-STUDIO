import { redirect } from "next/navigation";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message =
    error === "invalid" ? "Invalid email or password." :
    error === "not-admin" ? "This account is not an administrator." :
    error === "config" ? "Admin authentication is not configured." : "";

  return <main className="admin-login">
    <div className="admin-login-card">
      <p className="eyebrow">PETIT.SOT / ADMIN</p>
      <h1>Private<br/><em>archive.</em></h1>
      <form action="/api/admin/login" method="post">
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        {message && <p className="admin-error">{message}</p>}
        <button type="submit">Sign in <span>↗</span></button>
      </form>
    </div>
  </main>;
}

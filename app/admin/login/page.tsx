"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const supabase=createClient();
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){setError(error.message);setBusy(false);return;}
    router.replace("/admin");
    router.refresh();
  }

  return <main className="admin-login">
    <div className="admin-login-card">
      <p className="eyebrow">PETIT.SOT / ADMIN</p>
      <h1>Private<br/><em>archive.</em></h1>
      <form onSubmit={submit}>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
        {error && <p className="admin-error">{error}</p>}
        <button disabled={busy}>{busy?"Signing in…":"Sign in"} <span>↗</span></button>
      </form>
    </div>
  </main>;
}
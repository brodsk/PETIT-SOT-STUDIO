"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type State = "checking" | "paid" | "pending" | "error";

export default function PrintCheckoutSuccessPage() {
  const [state, setState] = useState<State>("checking");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("token");
    if (!orderId) { setState("error"); return; }
    let active = true;
    fetch("/api/paypal/capture-print-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).then(async response => {
      const data = await response.json();
      if (data.status === "COMPLETED") { if (active) setState("paid"); return; }
      if (data.status === "PENDING") { if (active) { setMessage(data.message || "Your payment was received and the order is being reviewed."); setState("pending"); } return; }
      throw new Error(data.error || "Payment could not be confirmed");
    }).catch(error => { if (active) { setMessage(error instanceof Error ? error.message : "Payment could not be confirmed."); setState("error"); } });
    return () => { active = false; };
  }, []);
  return <main className="archive" style={{ maxWidth: 760, margin: "0 auto", padding: "8rem 1.5rem", textAlign: "center" }}>
    <p className="eyebrow">PETIT.SOT STUDIO</p>
    {state === "checking" ? <><h1>Confirming your print order…</h1><p>Please keep this page open for a moment.</p></> :
      state === "paid" ? <><h1>Thank you for your purchase.</h1><p>Your payment is confirmed and your Fine Art Print order has been submitted to production.</p></> :
      state === "pending" ? <><h1>Payment received.</h1><p>{message}</p><p>We will review the order and contact you if anything else is needed.</p></> :
      <><h1>We couldn’t confirm the order.</h1><p>{message || "If PayPal shows a completed payment, please contact us before trying again."}</p></>}
    <Link className="interior-button" href="/works">Continue browsing</Link>
  </main>;
}

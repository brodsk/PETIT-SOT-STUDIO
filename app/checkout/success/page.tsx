"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const [status, setStatus] = useState<"checking" | "paid" | "error">("checking");

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("token");
    if (!orderId) {
      setStatus("error");
      return;
    }
    let active = true;
    fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.status !== "COMPLETED") throw new Error("Payment not completed");
        if (active) setStatus("paid");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => { active = false; };
  }, []);

  return (
    <main className="archive" style={{ maxWidth: 760, margin: "0 auto", padding: "8rem 1.5rem", textAlign: "center" }}>
      {status === "checking" ? (
        <><p className="eyebrow">PETIT.SOT STUDIO</p><h1>Confirming your payment…</h1><p>Please keep this page open for a moment.</p></>
      ) : status === "paid" ? (
        <><p className="eyebrow">PETIT.SOT STUDIO</p><h1>Thank you for your purchase.</h1><p>Your PayPal payment was completed successfully.</p><Link className="interior-button" href="/works">Continue browsing</Link></>
      ) : (
        <><p className="eyebrow">PETIT.SOT STUDIO</p><h1>We couldn’t confirm the payment.</h1><p>No successful payment has been confirmed on this page. If PayPal shows a completed payment, please contact us before trying again.</p><Link className="interior-button" href="/works">Return to the gallery</Link></>
      )}
    </main>
  );
}

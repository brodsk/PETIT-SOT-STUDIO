"use client";

import { useState } from "react";

export default function PayPalCheckoutButton({ slug, locale }: { slug: string; locale: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json();
      if (!response.ok || !data.approveUrl) {
        throw new Error(data.error || "Could not start checkout");
      }
      window.location.assign(data.approveUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
      setLoading(false);
    }
  }

  const ru = locale === "ru";
  return (
    <div className="paypal-checkout">
      <button className="purchase-button" type="button" onClick={startCheckout} disabled={loading}>
        {loading ? (ru ? "Подключаем PayPal…" : "Connecting to PayPal…") : (ru ? "Оплатить через PayPal" : "Pay with PayPal")}
      </button>
      {error && <p role="alert">{ru ? "Не удалось начать оплату. Попробуйте ещё раз." : "Could not start checkout. Please try again."}</p>}
    </div>
  );
}

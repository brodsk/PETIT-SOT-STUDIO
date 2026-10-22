"use client";

import { useState } from "react";

export default function PayPalCheckoutButton({ slug, locale }: { slug: string; locale: string }) {
  const [loading, setLoading] = useState<"paypal" | "card" | null>(null);
  const [error, setError] = useState("");
  const ru = locale === "ru";

  async function startCheckout(method: "paypal" | "card") {
    setLoading(method);
    setError("");
    try {
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json();
      if (!response.ok || !data.orderId || !data.approveUrl) {
        throw new Error(data.error || "Could not start checkout");
      }
      window.location.assign(data.approveUrl);
    } catch (reason) {
      console.error("PayPal checkout error", reason);
      setError(ru
        ? "Не удалось открыть оплату. Попробуйте ещё раз."
        : "Could not open checkout. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="paypal-checkout">
      <button
        className="purchase-button paypal-purchase-button"
        type="button"
        onClick={() => void startCheckout("paypal")}
        disabled={loading !== null}
      >
        <span>{loading === "paypal" ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Оплатить через PayPal" : "Pay with PayPal")}</span>
        <span aria-hidden="true">↗</span>
      </button>
      <button
        className="purchase-button paypal-purchase-button paypal-card-purchase-button"
        type="button"
        onClick={() => void startCheckout("card")}
        disabled={loading !== null}
      >
        <span>{loading === "card" ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Дебетовая или кредитная карта" : "Debit or credit card")}</span>
        <span aria-hidden="true">↗</span>
      </button>
      {error && <p className="paypal-checkout-error" role="alert">{error}</p>}
      <p className="paypal-checkout-note">
        {ru
          ? "Безопасная оплата через PayPal. Оплата картой доступна в зависимости от страны и настроек PayPal."
          : "Secure checkout via PayPal. Card payment availability depends on your country and PayPal settings."}
      </p>
    </div>
  );
}

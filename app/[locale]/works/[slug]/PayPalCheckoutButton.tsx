"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    paypal?: {
      FUNDING: { PAYPAL: string; CARD: string };
      Buttons: (options: Record<string, unknown>) => {
        isEligible: () => boolean;
        render: (selector: string) => Promise<void>;
      };
    };
  }
}

export default function PayPalCheckoutButton({ slug, locale }: { slug: string; locale: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const ru = locale === "ru";
  const paypalLocale = ru ? "ru_RU" : "en_US";

  useEffect(() => {
    let active = true;
    let script: HTMLScriptElement | null = null;

    async function setup() {
      try {
        const configResponse = await fetch("/api/paypal/client-config", { cache: "no-store" });
        const config = await configResponse.json();
        if (!configResponse.ok || !config.clientId) {
          throw new Error("PayPal Live is not configured");
        }

        if (!window.paypal) {
          script = document.createElement("script");
          script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&currency=EUR&intent=capture&components=buttons&enable-funding=card&locale=${paypalLocale}`;
          script.async = true;
          await new Promise<void>((resolve, reject) => {
            script!.onload = () => resolve();
            script!.onerror = () => reject(new Error("Could not load PayPal checkout"));
            document.head.appendChild(script!);
          });
        }

        if (!active || !window.paypal) return;

        const paypal = window.paypal;
        const createOrder = async () => {
          const response = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          });
          const data = await response.json();
          if (!response.ok || !data.orderId) {
            throw new Error(data.error || "Could not start checkout");
          }
          return data.orderId as string;
        };

        const onApprove = (data: { orderID: string }) => {
          window.location.assign(`/checkout/success?token=${encodeURIComponent(data.orderID)}`);
        };
        const onError = (reason: unknown) => {
          console.error("PayPal checkout error", reason);
          if (active) setError(ru ? "Не удалось открыть оплату. Попробуйте ещё раз." : "Could not open checkout. Please try again.");
        };

        const paypalButtons = paypal.Buttons({
          fundingSource: paypal.FUNDING.PAYPAL,
          style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 48 },
          createOrder,
          onApprove,
          onError,
        });
        await paypalButtons.render("#paypal-button-container");

        const cardButtons = paypal.Buttons({
          fundingSource: paypal.FUNDING.CARD,
          style: { layout: "vertical", color: "black", shape: "rect", label: "pay", height: 48 },
          createOrder,
          onApprove,
          onError,
        });
        if (cardButtons.isEligible()) {
          await cardButtons.render("#paypal-card-button-container");
        } else if (active) {
          const cardContainer = document.getElementById("paypal-card-button-container");
          if (cardContainer) cardContainer.hidden = true;
        }
        if (active) setLoading(false);
      } catch (reason) {
        console.error("PayPal checkout setup failed", reason);
        if (active) {
          setError(ru
            ? "Не удалось загрузить оплату. Проверьте настройки PayPal Live в Vercel."
            : "Could not load checkout. Please check the PayPal Live settings in Vercel.");
          setLoading(false);
        }
      }
    }

    void setup();
    return () => {
      active = false;
      if (script && !window.paypal) script.remove();
    };
  }, [slug, ru, paypalLocale]);

  return (
    <div className="paypal-checkout" aria-busy={loading}>
      {loading && <p>{ru ? "Загружаем способы оплаты…" : "Loading payment methods…"}</p>}
      <div id="paypal-button-container" />
      <div id="paypal-card-button-container" />
      {error && <p role="alert">{error}</p>}
      <p className="paypal-checkout-note">
        {ru
          ? "Оплата обрабатывается безопасно через PayPal. Доступные способы зависят от страны и устройства."
          : "Payments are securely processed by PayPal. Available methods depend on your country and device."}
      </p>
    </div>
  );
}

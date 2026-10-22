"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: {
      FUNDING: { CARD: string };
      Buttons: (options: {
        fundingSource: string;
        style?: Record<string, unknown>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => void;
        onError: (error: unknown) => void;
      }) => {
        isEligible: () => boolean;
        render: (selector: HTMLElement) => Promise<void>;
      };
    };
  }
}

export default function PayPalCheckoutButton({ slug, locale }: { slug: string; locale: string }) {
  const [loading, setLoading] = useState<"paypal" | "card" | null>(null);
  const [error, setError] = useState("");
  const cardContainer = useRef<HTMLDivElement>(null);
  const ru = locale === "ru";

  useEffect(() => {
    let cancelled = false;
    let cardButton: ReturnType<NonNullable<typeof window.paypal>["Buttons"]> | undefined;
    let script: HTMLScriptElement | null = null;

    async function setupCardButton() {
      try {
        const configResponse = await fetch("/api/paypal/client-config", { cache: "no-store" });
        const config = await configResponse.json();
        if (!configResponse.ok || !config.clientId || cancelled || !cardContainer.current) {
          throw new Error(config.error || "Card checkout is unavailable");
        }

        const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-card-sdk="true"]');
        if (existing) {
          if (!window.paypal) {
            await new Promise<void>((resolve, reject) => {
              existing.addEventListener("load", () => resolve(), { once: true });
              existing.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")), { once: true });
            });
          }
        } else {
          script = document.createElement("script");
          script.dataset.paypalCardSdk = "true";
          script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&currency=EUR&intent=capture&locale=${ru ? "ru_RU" : "en_US"}&components=buttons,funding-eligibility&enable-funding=card`;
          script.async = true;
          document.head.appendChild(script);
          await new Promise<void>((resolve, reject) => {
            script!.addEventListener("load", () => resolve(), { once: true });
            script!.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")), { once: true });
          });
        }

        if (cancelled || !window.paypal || !cardContainer.current) return;
        cardButton = window.paypal.Buttons({
          fundingSource: window.paypal.FUNDING.CARD,
          style: { layout: "vertical", color: "black", shape: "rect", height: 49, label: "pay", tagline: false },
          createOrder: async () => {
            setLoading("card");
            setError("");
            const response = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug }),
            });
            const data = await response.json();
            if (!response.ok || !data.orderId) throw new Error(data.error || "Could not start card checkout");
            return data.orderId as string;
          },
          onApprove: ({ orderID }) => {
            window.location.assign(`/checkout/success?token=${encodeURIComponent(orderID)}`);
          },
          onError: (reason) => {
            console.error("PayPal card checkout error", reason);
            setError(ru
              ? "Оплата картой не открылась. Попробуйте ещё раз или выберите PayPal."
              : "Card checkout could not be opened. Please try again or choose PayPal.");
            setLoading(null);
          },
        });
        if (!cardButton.isEligible()) {
          setError(ru
            ? "Оплата картой через PayPal сейчас недоступна для этого покупателя."
            : "PayPal card checkout is not currently available for this buyer.");
          return;
        }
        await cardButton.render(cardContainer.current);
      } catch (reason) {
        if (cancelled) return;
        console.error("PayPal card button setup error", reason);
        setError(ru
          ? "Не удалось загрузить оплату картой. Попробуйте PayPal."
          : "Could not load card checkout. Please try PayPal.");
      }
    }

    void setupCardButton();
    return () => {
      cancelled = true;
    };
  }, [slug, ru]);

  async function startPayPalCheckout() {
    setLoading("paypal");
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
        onClick={() => void startPayPalCheckout()}
        disabled={loading !== null}
      >
        <span>{loading === "paypal" ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Оплатить через PayPal" : "Pay with PayPal")}</span>
        <span aria-hidden="true">↗</span>
      </button>
      <div className="paypal-card-button-wrap" aria-label={ru ? "Оплата банковской картой" : "Pay by debit or credit card"}>
        <div ref={cardContainer} />
      </div>
      {error && <p className="paypal-checkout-error" role="alert">{error}</p>}
      <p className="paypal-checkout-note">
        {ru
          ? "Безопасная оплата через PayPal. Оплата картой без входа в аккаунт доступна не во всех странах."
          : "Secure checkout via PayPal. Paying by card without a PayPal account is not available in every country."}
      </p>
    </div>
  );
}

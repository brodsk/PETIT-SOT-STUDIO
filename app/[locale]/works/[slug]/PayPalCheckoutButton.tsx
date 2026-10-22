"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: any;
    google?: any;
    ApplePaySession?: any;
  }
}

function loadScript(src: string, marker: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-sdk-marker="${marker}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Payment SDK failed to load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.sdkMarker = marker;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("Payment SDK failed to load")), { once: true });
    document.head.appendChild(script);
  });
}

export default function PayPalCheckoutButton({
  slug,
  locale,
  price,
}: {
  slug: string;
  locale: string;
  price: number;
}) {
  const [loading, setLoading] = useState<"paypal" | "card" | "google" | "apple" | null>(null);
  const [error, setError] = useState("");
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const googleRef = useRef<HTMLDivElement>(null);
  const appleSessionRef = useRef<any>(null);
  const appleConfigRef = useRef<any>(null);
  const ru = locale === "ru";
  const message = (en: string, ruText: string) => ru ? ruText : en;

  async function createOrder(paymentMethod?: "googlepay") {
    const response = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, ...(paymentMethod ? { paymentMethod } : {}) }),
    });
    const data = await response.json();
    if (!response.ok || !data.orderId) throw new Error(data.error || "Could not start checkout");
    return data.orderId as string;
  }

  async function captureOrder(orderId: string) {
    const response = await fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await response.json();
    if (!response.ok || data.status !== "COMPLETED") throw new Error(data.error || "Payment capture failed");
  }

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const configResponse = await fetch("/api/paypal/client-config", { cache: "no-store" });
        const config = await configResponse.json();
        if (!configResponse.ok || !config.clientId) throw new Error(config.error || "PayPal is not configured");

        // Use PayPal JavaScript SDK v6 for Google Pay. Do not load v5 and v6 on the same page.
        await loadScript("https://www.paypal.com/web-sdk/v6/core", "paypal-v6-core");
        if (cancelled || !window.paypal?.createInstance) return;

        const sdk = await window.paypal.createInstance({
          clientId: config.clientId,
          components: ["googlepay-payments", "applepay-payments"],
          pageType: "checkout",
          locale: ru ? "ru-RU" : "en-US",
        });
        const methods = await sdk.findEligibleMethods({
          currencyCode: "EUR",
          amount: price.toFixed(2),
        });
        console.info("PayPal v6 eligible payment methods", {
          googlepay: methods.isEligible("googlepay"),
          applepay: methods.isEligible("applepay"),
        });

        if (window.ApplePaySession?.canMakePayments?.() && methods.isEligible("applepay")) {
          try {
            await loadScript("https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js", "apple-pay-sdk-v6");
            const appleDetails = methods.getDetails("applepay");
            const appleSession = sdk.createApplePayOneTimePaymentSession();
            const appleConfig = appleSession.formatConfigForPaymentRequest(appleDetails.config);
            if (!cancelled) {
              appleSessionRef.current = appleSession;
              appleConfigRef.current = appleConfig;
              setAppleAvailable(true);
            }
          } catch (e) {
            console.info("Apple Pay setup failed", e);
          }
        }
        if (!methods.isEligible("googlepay")) {
          console.info("Google Pay is not eligible for this buyer/merchant/amount.");
          return;
        }

        await loadScript("https://pay.google.com/gp/p/js/pay.js", "google-pay-sdk-v6");
        const googlePaySession = sdk.createGooglePayOneTimePaymentSession();
        const googlePayDetails = methods.getDetails("googlepay");
        const googlePayConfig = googlePaySession.formatConfigForPaymentRequest(googlePayDetails.config);

        const paymentsClient = new window.google.payments.api.PaymentsClient({
          environment: "PRODUCTION",
          paymentDataCallbacks: {
            onPaymentAuthorized: async (paymentData: any) => {
              try {
                setLoading("google");
                setError("");
                const orderId = await createOrder("googlepay");
                const confirmed = await googlePaySession.confirmOrder({
                  orderId,
                  paymentMethodData: paymentData.paymentMethodData,
                });

                if (confirmed.status === "PAYER_ACTION_REQUIRED") {
                  // Google's payment sheet must close before PayPal opens its 3DS flow.
                  window.setTimeout(() => {
                    void (async () => {
                      try {
                        await googlePaySession.initiatePayerAction({ orderId });
                        await captureOrder(orderId);
                        window.location.assign(`/checkout/success?token=${encodeURIComponent(orderId)}`);
                      } catch (e) {
                        console.error("Google Pay authentication failed", e);
                        setError(message("Google Pay authentication failed. Please try another method.", "Не удалось подтвердить Google Pay. Попробуйте другой способ оплаты."));
                        setLoading(null);
                      }
                    })();
                  }, 0);
                  return { transactionState: "SUCCESS" };
                }

                await captureOrder(orderId);
                window.location.assign(`/checkout/success?token=${encodeURIComponent(orderId)}`);
                return { transactionState: "SUCCESS" };
              } catch (e) {
                console.error("Google Pay payment failed", e);
                setError(message("Google Pay payment failed. Please try another method.", "Не удалось оплатить через Google Pay. Попробуйте другой способ оплаты."));
                setLoading(null);
                return {
                  transactionState: "ERROR",
                  error: { intent: "PAYMENT_AUTHORIZATION", message: "Payment failed" },
                };
              }
            },
          },
        });

        const ready = await paymentsClient.isReadyToPay({
          allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
          apiVersion: googlePayConfig.apiVersion,
          apiVersionMinor: googlePayConfig.apiVersionMinor,
        });
        console.info("Google Pay readiness check", { result: ready?.result });
        if (cancelled || !ready?.result || !googleRef.current) return;

        const button = paymentsClient.createButton({
          onClick: async () => {
            try {
              setLoading("google");
              setError("");
              await paymentsClient.loadPaymentData({
                ...googlePayConfig,
                transactionInfo: {
                  countryCode: googlePayConfig.countryCode,
                  currencyCode: "EUR",
                  totalPriceStatus: "FINAL",
                  totalPrice: price.toFixed(2),
                  totalPriceLabel: "PETIT.SOT STUDIO",
                },
                callbackIntents: ["PAYMENT_AUTHORIZATION"],
              });
            } catch (e: any) {
              if (e?.statusCode !== "CANCELED") {
                console.error("Google Pay could not open", e);
                setError(message("Google Pay could not be opened. Please try another method.", "Не удалось открыть Google Pay. Попробуйте другой способ оплаты."));
              }
              setLoading(null);
            }
          },
          buttonType: "buy",
          buttonColor: "black",
          buttonSizeMode: "fill",
        });
        googleRef.current.replaceChildren(button);
        setGoogleAvailable(true);
      } catch (e) {
        console.error("Google Pay setup failed", e);
        if (!cancelled) {
          setError(message(
            "Google Pay could not initialize. PayPal and card checkout are still available.",
            "Не удалось запустить Google Pay. PayPal и оплата картой остаются доступны.",
          ));
        }
      }
    }

    void setup();
    return () => { cancelled = true; };
  }, [slug, ru, price]);

  function startApplePay() {
    const appleSession = appleSessionRef.current;
    const config = appleConfigRef.current;
    if (!appleSession || !config || !window.ApplePaySession) return;
    setLoading("apple");
    setError("");
    try {
      const session = new window.ApplePaySession(4, {
        ...config,
        countryCode: config.countryCode || "SK",
        currencyCode: "EUR",
        total: { label: "PETIT.SOT STUDIO", type: "final", amount: price.toFixed(2) },
      });
      session.onvalidatemerchant = async (event: any) => {
        try {
          const result = await appleSession.validateMerchant({ validationUrl: event.validationURL });
          session.completeMerchantValidation(result.merchantSession);
        } catch (e) {
          console.error("Apple Pay merchant validation failed", e);
          session.abort();
          setError(message("Apple Pay validation failed. Please use another method.", "Не удалось подтвердить Apple Pay. Используйте другой способ оплаты."));
          setLoading(null);
        }
      };
      session.onpaymentauthorized = async (event: any) => {
        try {
          const orderId = await createOrder();
          const result = await appleSession.confirmOrder({ orderId, token: event.payment.token, billingContact: event.payment.billingContact });
          if (result.status === "PAYER_ACTION_REQUIRED") await appleSession.initiatePayerAction({ orderId });
          await captureOrder(orderId);
          session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
          window.location.assign("/checkout/success?token=" + encodeURIComponent(orderId));
        } catch (e) {
          console.error("Apple Pay payment failed", e);
          session.completePayment(window.ApplePaySession.STATUS_FAILURE);
          setError(message("Apple Pay payment failed. Please try another method.", "Не удалось оплатить через Apple Pay. Попробуйте другой способ."));
          setLoading(null);
        }
      };
      session.oncancel = () => setLoading(null);
      session.begin();
    } catch (e) {
      console.error("Apple Pay could not start", e);
      setError(message("Apple Pay could not be opened. Please use another method.", "Не удалось открыть Apple Pay. Используйте другой способ оплаты."));
      setLoading(null);
    }
  }

  async function startPayPalCheckout(method: "paypal" | "card") {
    setLoading(method);
    setError("");
    try {
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json();
      if (!response.ok || !data.approveUrl) throw new Error(data.error || "Could not start checkout");
      window.location.assign(data.approveUrl);
    } catch (reason) {
      console.error("PayPal checkout error", reason);
      setError(message("Could not open checkout. Please try again.", "Не удалось открыть оплату. Попробуйте ещё раз."));
      setLoading(null);
    }
  }

  return (
    <div className="paypal-checkout">
      {appleAvailable && (
        <button className="wallet-button apple-pay-button" type="button" onClick={() => void startApplePay()} disabled={loading !== null}>
          {loading === "apple" ? message("Loading Apple Pay…", "Загрузка Apple Pay…") : " Pay"}
        </button>
      )}
      {googleAvailable && <div className="wallet-button google-pay-button" ref={googleRef} aria-label="Google Pay" />}
      <button className="purchase-button paypal-purchase-button" type="button" onClick={() => void startPayPalCheckout("paypal")} disabled={loading !== null}>
        <span>{loading === "paypal" ? message("Loading…", "Загрузка…") : message("Pay with PayPal", "Оплатить через PayPal")}</span>
        <span aria-hidden="true">↗</span>
      </button>
      <button className="purchase-button paypal-purchase-button card-checkout-button" type="button" onClick={() => void startPayPalCheckout("card")} disabled={loading !== null}>
        {loading === "card" ? message("Loading…", "Загрузка…") : message("Pay by debit or credit card", "Оплатить банковской картой")}
      </button>
      {error && <p className="paypal-checkout-error" role="alert">{error}</p>}
      <p className="paypal-checkout-note">
        {message(
          "Secure checkout via PayPal. Google Pay appears when supported by your browser, device and PayPal account.",
          "Безопасная оплата через PayPal. Google Pay отображается при поддержке браузером, устройством и аккаунтом PayPal.",
        )}
      </p>
    </div>
  );
}

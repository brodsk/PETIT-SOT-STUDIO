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
      // A marker alone is not enough: client-side locale navigation can request a
      // different PayPal SDK URL while the old script is still in the document.
      if (existing.src !== src) {
        existing.remove();
        if (marker.startsWith("paypal-payment-sdk")) {
          delete window.paypal;
        }
      } else {
        if (existing.dataset.loaded === "true") return resolve();
        existing.addEventListener("load", () => {
          existing.dataset.loaded = "true";
          resolve();
        }, { once: true });
        existing.addEventListener("error", () => reject(new Error("Payment SDK failed to load")), { once: true });
        return;
      }
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
  const [loading, setLoading] = useState<"paypal" | "card" | "apple" | "google" | null>(null);
  const [error, setError] = useState("");
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const cardContainer = useRef<HTMLDivElement>(null);
  const googleRef = useRef<HTMLDivElement>(null);
  const appleClientRef = useRef<any>(null);
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
    let cardButton: any;

    async function setup() {
      try {
        const configResponse = await fetch("/api/paypal/client-config", { cache: "no-store" });
        const config = await configResponse.json();
        if (!configResponse.ok || !config.clientId) throw new Error(config.error || "PayPal is not configured");

        await loadScript(
          `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&currency=EUR&intent=capture&locale=en_US&components=buttons,funding-eligibility,applepay,googlepay&enable-funding=card`,
          "paypal-payment-sdk",
        );
        if (cancelled || !window.paypal) return;

        if (cardContainer.current) {
          cardButton = window.paypal.Buttons({
            fundingSource: window.paypal.FUNDING.CARD,
            style: { layout: "vertical", color: "black", shape: "rect", height: 49, label: "pay", tagline: false },
            createOrder: async () => {
              setLoading("card");
              setError("");
              return await createOrder();
            },
            onApprove: ({ orderID }: { orderID: string }) => {
              window.location.assign(`/checkout/success?token=${encodeURIComponent(orderID)}`);
            },
            onError: (reason: unknown) => {
              console.error("PayPal card checkout error", reason);
              setError(message("Card checkout could not be opened. Please try again or choose PayPal.", "Оплата картой не открылась. Попробуйте ещё раз или выберите PayPal."));
              setLoading(null);
            },
          });
          if (cardButton.isEligible()) await cardButton.render(cardContainer.current);
        }

        // Load Apple’s web SDK too; it enables Apple Pay support in additional compatible browsers.
        if (!window.ApplePaySession && window.paypal.Applepay) {
          try { await loadScript("https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js", "apple-pay-sdk"); }
          catch (e) { console.info("Apple Pay web SDK unavailable", e); }
        }

        // Apple Pay: only show the wallet after both browser/device and PayPal eligibility checks pass.
        if (window.ApplePaySession && window.ApplePaySession.canMakePayments?.() && window.paypal.Applepay) {
          try {
            const apple = window.paypal.Applepay();
            const appleConfig = await apple.config();
            if (!cancelled && appleConfig?.isEligible) {
              appleClientRef.current = apple;
              appleConfigRef.current = appleConfig;
              setAppleAvailable(true);
            }
          } catch (e) {
            console.info("Apple Pay is not available in this browser/account", e);
          }
        }

        // Google Pay availability is checked by PayPal and Google, not inferred from the device type.
        if (window.paypal.Googlepay) {
          try {
            await loadScript("https://pay.google.com/gp/p/js/pay.js", "google-pay-sdk");
            const googlePay = window.paypal.Googlepay();
            const googleConfig = await googlePay.config();
            const paymentsClient = new window.google.payments.api.PaymentsClient({
              environment: "PRODUCTION",
              paymentDataCallbacks: {
                onPaymentAuthorized: async (paymentData: any) => {
                  try {
                    setLoading("google");
                    const orderId = await createOrder("googlepay");
                    const confirmed = await googlePay.confirmOrder({
                      orderId,
                      paymentMethodData: paymentData.paymentMethodData,
                      ...(paymentData.email ? { email: paymentData.email } : {}),
                      ...(paymentData.shippingAddress ? { shippingAddress: paymentData.shippingAddress } : {}),
                    });
                    if (confirmed.status !== "APPROVED") throw new Error("Google Pay payment was not approved");
                    await captureOrder(orderId);
                    window.location.assign(`/checkout/success?token=${encodeURIComponent(orderId)}`);
                    return { transactionState: "SUCCESS" };
                  } catch (e) {
                    console.error("Google Pay payment failed", e);
                    setError(message("Google Pay payment failed. Please try another method.", "Не удалось оплатить через Google Pay. Попробуйте другой способ."));
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
              apiVersion: 2,
              apiVersionMinor: 0,
              allowedPaymentMethods: googleConfig.allowedPaymentMethods,
            });
            console.info("Google Pay readiness check:", { result: ready?.result, hasAllowedPaymentMethods: Boolean(googleConfig?.allowedPaymentMethods?.length), hasMerchantInfo: Boolean(googleConfig?.merchantInfo) });
            if (!cancelled && !ready?.result) {
              setError(message(
                "Google Pay is not ready on this device/browser or is not enabled for this PayPal account. Check Google Wallet has an eligible card and PayPal production Google Pay onboarding is complete.",
                "Google Pay не готов на этом устройстве/в браузере или не включён для аккаунта PayPal. Проверьте, что в Google Wallet есть подходящая карта и завершено подключение Google Pay для production в PayPal.",
              ));
            }
            if (!cancelled && ready?.result && googleRef.current) {
              const button = paymentsClient.createButton({
                onClick: async () => {
                  try {
                    setLoading("google");
                    setError("");
                    const paymentDataRequest = {
                      apiVersion: 2,
                      apiVersionMinor: 0,
                      allowedPaymentMethods: googleConfig.allowedPaymentMethods,
                      merchantInfo: googleConfig.merchantInfo,
                      transactionInfo: {
                        currencyCode: "EUR",
                        totalPriceStatus: "FINAL",
                        totalPrice: price.toFixed(2),
                      },
                      callbackIntents: ["PAYMENT_AUTHORIZATION"],
                    };
                    await paymentsClient.loadPaymentData(paymentDataRequest);
                  } catch (e: any) {
                    if (e?.statusCode !== "CANCELED") {
                      console.error("Google Pay could not open", e);
                      setError(message("Google Pay could not be opened. Please try another method.", "Не удалось открыть Google Pay. Попробуйте другой способ."));
                    }
                    setLoading(null);
                  }
                },
                buttonType: "buy",
                buttonColor: "black",
              });
              googleRef.current.replaceChildren(button);
              setGoogleAvailable(true);
            }
          } catch (e) {
            console.error("Google Pay setup failed:", e);
            setError(message(
              `Google Pay is unavailable: ${e instanceof Error ? e.message : String(e)}. Please check PayPal eligibility and try again.`,
              `Google Pay недоступен: ${e instanceof Error ? e.message : String(e)}. Проверьте доступность в PayPal и попробуйте снова.`,
            ));
          }
        }
      } catch (reason) {
        if (cancelled) return;
        console.error("PayPal checkout setup error", reason);
        setError(message("Could not load all payment options. PayPal may still be available.", "Не удалось загрузить все способы оплаты. PayPal может оставаться доступен."));
      }
    }

    void setup();
    return () => {
      cancelled = true;
      try { cardButton?.close?.(); } catch { /* no-op */ }
    };
  }, [slug, ru, price]);

  function startApplePay() {
    const apple = appleClientRef.current;
    const config = appleConfigRef.current;
    if (!apple || !config || !window.ApplePaySession) return;
    setLoading("apple");
    setError("");
    try {
      // Apple requires session construction and begin() directly in the click gesture.
      const session = new window.ApplePaySession(4, {
        countryCode: config.countryCode,
        merchantCapabilities: config.merchantCapabilities,
        supportedNetworks: config.supportedNetworks,
        currencyCode: "EUR",
        total: { label: "PETIT.SOT STUDIO", type: "final", amount: price.toFixed(2) },
      });
      session.onvalidatemerchant = async (event: any) => {
        try {
          const result = await apple.validateMerchant({
            validationUrl: event.validationURL,
            displayName: "PETIT.SOT STUDIO",
          });
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
          const result = await apple.confirmOrder({
            orderId,
            token: event.payment.token,
            billingContact: event.payment.billingContact,
          });
          if (result.status !== "APPROVED") throw new Error("Apple Pay order was not approved");
          await captureOrder(orderId);
          session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
          window.location.assign(`/checkout/success?token=${encodeURIComponent(orderId)}`);
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
      setError(message("Apple Pay could not be opened. Please try another method.", "Не удалось открыть Apple Pay. Попробуйте другой способ."));
      setLoading(null);
    }
  }

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
      <button className="purchase-button paypal-purchase-button" type="button" onClick={() => void startPayPalCheckout()} disabled={loading !== null}>
        <span>{loading === "paypal" ? message("Loading…", "Загрузка…") : message("Pay with PayPal", "Оплатить через PayPal")}</span>
        <span aria-hidden="true">↗</span>
      </button>
      <div className="paypal-card-button-wrap" aria-label={message("Pay by debit or credit card", "Дебетовая или кредитная карта")}>
        <div ref={cardContainer} />
        {ru && <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff", borderRadius: 4, fontSize: 15, fontWeight: 500, pointerEvents: "none" }}>Дебетовая или кредитная карта</div>}
      </div>
      {error && <p className="paypal-checkout-error" role="alert">{error}</p>}
      <p className="paypal-checkout-note">
        {message(
          "Secure checkout via PayPal. Wallet options appear only when supported by your browser, device and PayPal account.",
          "Безопасная оплата через PayPal. Кошельки отображаются только при поддержке браузером, устройством и аккаунтом PayPal.",
        )}
      </p>
    </div>
  );
}

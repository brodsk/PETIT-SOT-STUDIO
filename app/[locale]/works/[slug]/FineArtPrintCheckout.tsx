"use client";

import { useEffect, useRef, useState } from "react";

declare global { interface Window { paypal?: any } }

const COUNTRIES = [
  ["SK","Slovakia"],["CZ","Czechia"],["AT","Austria"],["DE","Germany"],["PL","Poland"],["HU","Hungary"],
  ["SI","Slovenia"],["HR","Croatia"],["IT","Italy"],["FR","France"],["ES","Spain"],["PT","Portugal"],
  ["NL","Netherlands"],["BE","Belgium"],["LU","Luxembourg"],["IE","Ireland"],["DK","Denmark"],["SE","Sweden"],
  ["FI","Finland"],["EE","Estonia"],["LV","Latvia"],["LT","Lithuania"],["RO","Romania"],["BG","Bulgaria"],
  ["GR","Greece"],["CY","Cyprus"],["MT","Malta"],["GB","United Kingdom"],["CH","Switzerland"],["NO","Norway"],
  ["US","United States"],["CA","Canada"],["AU","Australia"],["NZ","New Zealand"]
];

export default function FineArtPrintCheckout({ variants, locale }: {
  variants: { id: string; size_label: string; width_mm: number; height_mm: number; retail_price_eur: number }[];
  locale: string;
}) {
  const ru = locale === "ru";
  const [selected, setSelected] = useState(variants[0]?.id || "");
  const [country, setCountry] = useState("SK");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let buttons: any;
    async function setup() {
      if (!selected || !mountRef.current) return;
      setError("");
      setLoading(true);
      try {
        const configResponse = await fetch("/api/paypal/client-config", { cache: "no-store" });
        const config = await configResponse.json();
        if (!configResponse.ok || !config.clientId) throw new Error(config.error || "PayPal is not configured");
        const src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(config.clientId) + "&currency=EUR&intent=capture&components=buttons";
        if (!window.paypal) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>('script[data-petit-print-paypal="true"]');
            if (existing) {
              existing.addEventListener("load", () => resolve(), { once: true });
              existing.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")), { once: true });
              if (window.paypal) resolve();
              return;
            }
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.dataset.petitPrintPaypal = "true";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("PayPal SDK failed to load"));
            document.head.appendChild(script);
          });
        }
        if (cancelled || !window.paypal || !mountRef.current) return;
        mountRef.current.innerHTML = "";
        buttons = window.paypal.Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", height: 48, label: "paypal", tagline: false },
          createOrder: async () => {
            setError("");
            const response = await fetch("/api/paypal/create-print-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ variantId: selected, countryCode: country }),
            });
            const data = await response.json();
            if (!response.ok || !data.orderId) throw new Error(data.error || "Could not start print checkout");
            return data.orderId;
          },
          onApprove: ({ orderID }: { orderID: string }) => {
            window.location.assign("/checkout/print-success?token=" + encodeURIComponent(orderID));
          },
          onCancel: () => setError(ru ? "Оплата отменена. Вы можете попробовать снова." : "Checkout was cancelled. You can try again."),
          onError: (reason: unknown) => {
            console.error("Fine art print PayPal error", reason);
            setError(ru ? "Не удалось открыть оплату. Попробуйте ещё раз." : "Could not open payment. Please try again.");
          },
        });
        if (buttons.isEligible()) await buttons.render(mountRef.current);
        else setError(ru ? "PayPal сейчас недоступен в этом браузере." : "PayPal is not available in this browser.");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Checkout unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setup();
    return () => { cancelled = true; try { buttons?.close?.(); } catch {} };
  }, [selected, country, ru]);

  const active = variants.find(v => v.id === selected);
  return <section className="fine-art-print-checkout" style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--line, #ddd)" }}>
    <p className="purchase-label">{ru ? "FINE ART PRINTS" : "FINE ART PRINTS"}</p>
    <h2 style={{ fontFamily: "Georgia,serif", fontWeight: 400, fontSize: 25, margin: "8px 0 14px" }}>
      {ru ? "Заказать художественный принт" : "Order a Fine Art Print"}
    </h2>
    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>{ru ? "Размер" : "Print size"}</label>
    <select value={selected} onChange={e => setSelected(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 14 }}>
      {variants.map(v => <option key={v.id} value={v.id}>{v.size_label} · {v.width_mm} × {v.height_mm} mm — €{Number(v.retail_price_eur).toFixed(2)}</option>)}
    </select>
    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>{ru ? "Страна доставки" : "Delivery country"}</label>
    <select value={country} onChange={e => setCountry(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 12 }}>
      {COUNTRIES.map(([code,name]) => <option key={code} value={code}>{name}</option>)}
    </select>
    {active && <p style={{ fontSize: 13, opacity: .72 }}>{ru ? "Стоимость доставки будет рассчитана Prodigi и добавлена перед подтверждением оплаты." : "Delivery is quoted by Prodigi and added before you approve the payment."}</p>}
    <div ref={mountRef} />
    {loading && <p style={{ fontSize: 12, opacity: .6 }}>{ru ? "Загрузка оплаты…" : "Loading checkout…"}</p>}
    {error && <p role="alert" style={{ color: "#9b3027", fontSize: 13 }}>{error}</p>}
  </section>;
}

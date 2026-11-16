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
  const sk = locale === "sk";
  const checkoutPrefix = locale === "en" ? "" : "/" + locale;
  const t = (en:string, ruText:string, skText:string) => ru ? ruText : sk ? skText : en;
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
        const src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(config.clientId) + "&currency=EUR&intent=capture&locale="+(ru?"ru_RU":sk?"sk_SK":"en_US")+"&components=buttons,card-fields,funding-eligibility,applepay,googlepay&enable-funding=card";
        if (!window.paypal) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>('script[data-sdk-marker="paypal-payment-sdk"]');
            if (existing && existing.src === src) {
              if (existing.dataset.loaded === "true" || window.paypal) return resolve();
              existing.addEventListener("load", () => { existing.dataset.loaded = "true"; resolve(); }, { once: true });
              existing.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")), { once: true });
              return;
            }
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.dataset.sdkMarker = "paypal-payment-sdk";
            script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve(); }, { once: true });
            script.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")), { once: true });
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
            window.location.assign(checkoutPrefix + "/checkout/print-success?token=" + encodeURIComponent(orderID));
          },
          onCancel: () => setError(t("Checkout was cancelled. You can try again.","Оплата отменена. Вы можете попробовать снова.","Platba bola zrušená. Môžete to skúsiť znova.")),
          onError: (reason: unknown) => {
            console.error("Fine art print PayPal error", reason);
            setError(t("Could not open payment. Please try again.","Не удалось открыть оплату. Попробуйте ещё раз.","Platbu sa nepodarilo otvoriť. Skúste to znova."));
          },
        });
        if (buttons.isEligible()) await buttons.render(mountRef.current);
        else setError(t("PayPal is not available in this browser.","PayPal сейчас недоступен в этом браузере.","PayPal nie je v tomto prehliadači dostupný."));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t("Checkout unavailable","Оплата временно недоступна.","Platba je momentálne nedostupná."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setup();
    return () => { cancelled = true; try { buttons?.close?.(); } catch {} };
  }, [selected, country, ru, sk]);

  const active = variants.find(v => v.id === selected);
  return <section className="fine-art-print-checkout" style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--line, #ddd)" }}>
    <p className="purchase-label">{ru ? "ХУДОЖЕСТВЕННЫЕ ПРИНТЫ" : sk ? "UMELECKÉ REPRODUKCIE" : "FINE ART PRINTS"}</p>
    <h2 style={{ fontFamily: "Georgia,serif", fontWeight: 400, fontSize: 25, margin: "8px 0 14px" }}>
      {t("Order a Fine Art Print","Заказать художественный принт","Objednať umeleckú reprodukciu")}
    </h2>
    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>{t("Print size","Размер","Veľkosť reprodukcie")}</label>
    <select value={selected} onChange={e => setSelected(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 14 }}>
      {variants.map(v => <option key={v.id} value={v.id}>{v.size_label} · {v.width_mm} × {v.height_mm} mm — €{Number(v.retail_price_eur).toFixed(2)}</option>)}
    </select>
    <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>{t("Delivery country","Страна доставки","Krajina doručenia")}</label>
    <select value={country} onChange={e => setCountry(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 12 }}>
      {COUNTRIES.map(([code,name]) => <option key={code} value={code}>{new Intl.DisplayNames([ru?"ru":sk?"sk":"en"],{type:"region"}).of(code)||name}</option>)}
    </select>
    {active && <p style={{ fontSize: 13, opacity: .72 }}>{t("Delivery is quoted by Prodigi and added before you approve the payment.","Стоимость доставки будет рассчитана Prodigi и добавлена перед подтверждением оплаты.","Cenu dopravy vypočíta Prodigi a pripočíta ju pred potvrdením platby.")}</p>}
    <div ref={mountRef} />
    {loading && <p style={{ fontSize: 12, opacity: .6 }}>{t("Loading checkout…","Загрузка оплаты…","Načítava sa platba…")}</p>}
    {error && <p role="alert" style={{ color: "#9b3027", fontSize: 13 }}>{error}</p>}
  </section>;
}

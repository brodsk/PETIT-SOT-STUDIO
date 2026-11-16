"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const ru = locale === "ru";
  const sk = locale === "sk";
  const [status, setStatus] = useState<"checking" | "paid" | "error">("checking");

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("token");
    if (!orderId) { setStatus("error"); return; }
    let active = true;
    fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok || data.status !== "COMPLETED") throw new Error("Payment not completed");
      if (active) setStatus("paid");
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);

  const gallery = locale === "en" ? "/works" : "/" + locale + "/works";
  return (
    <main className="archive" style={{ maxWidth: 760, margin: "0 auto", padding: "8rem 1.5rem", textAlign: "center" }}>
      <p className="eyebrow">PETIT.SOT STUDIO</p>
      {status === "checking" ? (
        <><h1>{ru ? "Подтверждаем оплату…" : sk ? "Potvrdzujeme platbu…" : "Confirming your payment…"}</h1><p>{ru ? "Пожалуйста, не закрывайте эту страницу." : sk ? "Nezatvárajte, prosím, túto stránku." : "Please keep this page open for a moment."}</p></>
      ) : status === "paid" ? (
        <><h1>{ru ? "Спасибо за покупку." : sk ? "Ďakujeme za nákup." : "Thank you for your purchase."}</h1><p>{ru ? "Платёж PayPal успешно завершён." : sk ? "Platba cez PayPal bola úspešne dokončená." : "Your PayPal payment was completed successfully."}</p><Link className="interior-button" href={gallery}>{ru ? "Продолжить просмотр" : sk ? "Pokračovať v prehliadaní" : "Continue browsing"}</Link></>
      ) : (
        <><h1>{ru ? "Не удалось подтвердить оплату." : sk ? "Platbu sa nepodarilo potvrdiť." : "We couldn’t confirm the payment."}</h1><p>{ru ? "На этой странице не подтверждена успешная оплата. Если PayPal показывает завершённый платёж, свяжитесь с нами, прежде чем повторять попытку." : sk ? "Na tejto stránke sa nepodarilo potvrdiť úspešnú platbu. Ak PayPal zobrazuje dokončenú platbu, pred opakovaním platby nás kontaktujte." : "No successful payment has been confirmed on this page. If PayPal shows a completed payment, please contact us before trying again."}</p><Link className="interior-button" href={gallery}>{ru ? "Вернуться в галерею" : sk ? "Späť do galérie" : "Return to the gallery"}</Link></>
      )}
    </main>
  );
}

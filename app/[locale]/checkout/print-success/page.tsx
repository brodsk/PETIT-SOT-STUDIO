"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type State = "checking" | "paid" | "pending" | "error";

export default function PrintCheckoutSuccessPage() {
  const params = useParams();
  const locale = String(params.locale || "en");
  const ru = locale === "ru";
  const sk = locale === "sk";
  const [state, setState] = useState<State>("checking");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("token");
    if (!orderId) { setState("error"); return; }
    let active = true;
    fetch("/api/paypal/capture-print-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).then(async response => {
      const data = await response.json();
      if (data.status === "COMPLETED") { if (active) setState("paid"); return; }
      if (data.status === "PENDING") { if (active) { setMessage(data.message || (ru ? "Платёж получен, заказ проходит проверку." : sk ? "Platba bola prijatá a objednávka sa kontroluje." : "Your payment was received and the order is being reviewed.")); setState("pending"); } return; }
      throw new Error(data.error || (ru ? "Не удалось подтвердить оплату." : sk ? "Platbu sa nepodarilo potvrdiť." : "Payment could not be confirmed"));
    }).catch(error => { if (active) { setMessage(error instanceof Error ? error.message : (ru ? "Не удалось подтвердить оплату." : sk ? "Platbu sa nepodarilo potvrdiť." : "Payment could not be confirmed.")); setState("error"); } });
    return () => { active = false; };
  }, [ru, sk]);
  const gallery = locale === "en" ? "/works" : "/" + locale + "/works";
  return <main className="archive" style={{ maxWidth: 760, margin: "0 auto", padding: "8rem 1.5rem", textAlign: "center" }}>
    <p className="eyebrow">PETIT.SOT STUDIO</p>
    {state === "checking" ? <><h1>{ru ? "Подтверждаем заказ принта…" : sk ? "Potvrdzujeme objednávku reprodukcie…" : "Confirming your print order…"}</h1><p>{ru ? "Пожалуйста, не закрывайте эту страницу." : sk ? "Nezatvárajte, prosím, túto stránku." : "Please keep this page open for a moment."}</p></> :
      state === "paid" ? <><h1>{ru ? "Спасибо за покупку." : sk ? "Ďakujeme za nákup." : "Thank you for your purchase."}</h1><p>{ru ? "Платёж подтверждён, заказ художественного принта отправлен в производство." : sk ? "Platba je potvrdená a objednávka umeleckej reprodukcie bola odoslaná do výroby." : "Your payment is confirmed and your Fine Art Print order has been submitted to production."}</p></> :
      state === "pending" ? <><h1>{ru ? "Платёж получен." : sk ? "Platba bola prijatá." : "Payment received."}</h1><p>{message}</p><p>{ru ? "Мы проверим заказ и свяжемся с вами, если понадобится дополнительная информация." : sk ? "Objednávku skontrolujeme a v prípade potreby vás kontaktujeme." : "We will review the order and contact you if anything else is needed."}</p></> :
      <><h1>{ru ? "Не удалось подтвердить заказ." : sk ? "Objednávku sa nepodarilo potvrdiť." : "We couldn’t confirm the order."}</h1><p>{message || (ru ? "Если PayPal показывает завершённый платёж, свяжитесь с нами, прежде чем повторять попытку." : sk ? "Ak PayPal zobrazuje dokončenú platbu, pred opakovaním platby nás kontaktujte." : "If PayPal shows a completed payment, please contact us before trying again.")}</p></>}
    <Link className="interior-button" href={gallery}>{ru ? "Продолжить просмотр" : sk ? "Pokračovať v prehliadaní" : "Continue browsing"}</Link>
  </main>;
}

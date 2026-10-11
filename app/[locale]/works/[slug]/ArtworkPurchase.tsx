"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";

type Props = {
  title: string;
  slug: string;
  priceLabel: string;
  etsyUrl?: string | null;
  ru: boolean;
};

export default function ArtworkPurchase({ title, slug, priceLabel, etsyUrl, ru }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  useEffect(() => {
    const telegramName = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    if (telegramName) {
      const fullName = [telegramName.first_name, telegramName.last_name].filter(Boolean).join(" ");
      if (fullName) setName((current) => current || fullName);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const workUrl = `${window.location.origin}/works/${encodeURIComponent(slug)}`;
    const fullMessage = [
      `PURCHASE REQUEST — PETIT.SOT`,
      `Artwork: ${title}`,
      `Listed price: ${priceLabel}`,
      `Artwork page: ${workUrl}`,
      message.trim() ? `Buyer message: ${message.trim()}` : "",
      (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.username
        ? `Telegram username: @${(window as any).Telegram.WebApp.initDataUnsafe.user.username}`
        : "",
    ].filter(Boolean).join("\n");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message: fullMessage, website: "" }),
      });
      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const inputStyle: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #c8c4bc",
    background: "transparent",
    padding: "12px 13px",
    color: "inherit",
    borderRadius: 0,
    font: "inherit",
    fontSize: 13,
  };

  return (
    <div className="purchase-box">
      <div>
        <span className="purchase-label">{ru ? "Доступна" : "Available"}</span>
        <strong>{priceLabel}</strong>
      </div>

      {etsyUrl && (
        <a className="purchase-button" href={etsyUrl} target="_blank" rel="noopener noreferrer">
          {ru ? "Купить на Etsy" : "Buy on Etsy"} <span>↗</span>
        </a>
      )}

      <button
        type="button"
        className="purchase-button"
        onClick={() => { setOpen((value) => !value); setStatus("idle"); }}
        style={{ width: "100%", cursor: "pointer", justifyContent: "space-between", background: "transparent", color: "inherit" }}
      >
        {ru ? "Запросить покупку здесь" : "Request purchase here"} <span>{open ? "−" : "+"}</span>
      </button>

      {!open && (
        <p>{ru
          ? "Оставьте запрос, и мы свяжемся с вами по поводу приобретения картины прямо через Telegram."
          : "Send an enquiry and we’ll contact you about purchasing this artwork."}</p>
      )}

      {open && status !== "success" && (
        <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 8 }}>
          <label style={{ display: "grid", gap: 5, fontSize: 11 }}>
            {ru ? "Ваше имя" : "Your name"}
            <input required maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 11 }}>
            {ru ? "Электронная почта" : "Email address"}
            <input required type="email" maxLength={160} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 5, fontSize: 11 }}>
            {ru ? "Сообщение (необязательно)" : "Message (optional)"}
            <textarea rows={3} maxLength={1500} value={message} onChange={(event) => setMessage(event.target.value)} style={{ ...inputStyle, resize: "vertical" }} />
          </label>
          {status === "error" && <p role="alert" style={{ margin: 0 }}>{ru ? "Не удалось отправить запрос. Попробуйте ещё раз." : "Could not send your request. Please try again."}</p>}
          <button type="submit" className="purchase-button" disabled={status === "sending"} style={{ cursor: status === "sending" ? "wait" : "pointer", justifyContent: "space-between" }}>
            {status === "sending" ? (ru ? "Отправка…" : "Sending…") : (ru ? "Отправить запрос" : "Send request")} <span>↗</span>
          </button>
          <p style={{ margin: 0 }}>{ru ? "Это запрос, а не оплата. Мы подтвердим наличие и детали отдельно." : "This is an enquiry, not a payment. We’ll confirm availability and details with you."}</p>
        </form>
      )}

      {status === "success" && (
        <p role="status" style={{ marginTop: 12 }}>
          {ru ? "Спасибо! Запрос отправлен. Мы свяжемся с вами." : "Thank you — your enquiry has been sent. We’ll be in touch."}
        </p>
      )}
    </div>
  );
}

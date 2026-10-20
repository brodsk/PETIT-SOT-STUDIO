"use client";

import {FormEvent, useEffect, useRef, useState} from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    callback: (token: string) => void;
    "expired-callback"?: () => void;
    "error-callback"?: () => void;
    theme?: "light" | "dark" | "auto";
  }) => string;
  remove: (widgetId: string) => void;
};
declare global {
  interface Window { turnstile?: TurnstileApi; }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export default function ContactForm({ru}:{ru:boolean}) {
  const [status, setStatus] = useState<"idle"|"sending"|"sent"|"error">("idle");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(!TURNSTILE_SITE_KEY);
  const [captchaError, setCaptchaError] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !captchaRef.current) return;
    let widgetId: string | undefined;
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !captchaRef.current || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(captchaRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "auto",
        callback: (token) => { setCaptchaToken(token); setCaptchaError(false); },
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => { setCaptchaToken(""); setCaptchaError(true); },
      });
      setCaptchaReady(true);
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let script = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
      script.addEventListener("error", () => { if (!cancelled) setCaptchaError(true); });
      if (window.turnstile) renderWidget();
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setCaptchaError(true);
      return;
    }
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          name: String(data.get("name") || "").trim(),
          email: String(data.get("email") || "").trim(),
          message: String(data.get("message") || "").trim(),
          website: String(data.get("website") || "").trim(),
          turnstileToken: captchaToken,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      form.reset();
      setCaptchaToken("");
      setCaptchaError(false);
      setStatus("sent");
      if (TURNSTILE_SITE_KEY && window.turnstile && captchaRef.current) {
        window.turnstile.remove(captchaRef.current.dataset.widgetId || "");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-honeypot" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      </div>
      <label>
        <span>{ru ? "Имя" : "Name"}</span>
        <input name="name" type="text" required maxLength={80} autoComplete="name"/>
      </label>
      <label>
        <span>Email</span>
        <input name="email" type="email" required maxLength={254} autoComplete="email"/>
      </label>
      <label>
        <span>{ru ? "Сообщение" : "Message"}</span>
        <textarea name="message" required maxLength={4000} rows={6}/>
      </label>
      {TURNSTILE_SITE_KEY && (
        <div className="contact-captcha-wrap">
          <div ref={captchaRef} className="contact-captcha" />
          {captchaError && (
            <p className="contact-form-status error">
              {ru ? "Пройдите проверку безопасности и попробуйте снова." : "Please complete the security check and try again."}
            </p>
          )}
          {!captchaReady && !captchaError && (
            <p className="contact-form-status">{ru ? "Загрузка проверки безопасности…" : "Loading security check…"}</p>
          )}
        </div>
      )}
      <button type="submit" disabled={status === "sending" || (Boolean(TURNSTILE_SITE_KEY) && (!captchaToken || !captchaReady))}>
        <span>{status === "sending" ? (ru ? "Отправка…" : "Sending…") : (ru ? "Отправить" : "Send")}</span>
        <strong>↗</strong>
      </button>
      {status === "sent" && <p className="contact-form-status success">{ru ? "Сообщение отправлено. Спасибо." : "Message sent. Thank you."}</p>}
      {status === "error" && <p className="contact-form-status error">{ru ? "Не удалось отправить сообщение. Попробуйте ещё раз." : "Something went wrong. Please try again."}</p>}
    </form>
  );
}

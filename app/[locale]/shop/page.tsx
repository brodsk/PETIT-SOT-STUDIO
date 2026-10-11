import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { getWorks, localizeMedium } from "../../../lib/works";

export const metadata: Metadata = {
  title: "Shop — PETIT.SOT STUDIO",
  description: "Discover original paintings by Olga Trikhleb.",
  robots: { index: false, follow: true },
};

export default async function TelegramShop({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  const works = (await getWorks()).filter((work) => work.available);
  const formatPrice = (price: number, currency: string) =>
    price > 0
      ? new Intl.NumberFormat(ru ? "ru-RU" : "en-IE", { style: "currency", currency }).format(price)
      : ru ? "Цена по запросу" : "Price on request";

  return (
    <>
      <Script id="telegram-mini-app-init" strategy="afterInteractive">{`
        (function () {
          function initTelegramShop() {
            var app = window.Telegram && window.Telegram.WebApp;
            if (!app) return;
            app.ready();
            app.expand();
            try { app.setHeaderColor("#f7f6f2"); } catch (e) {}
            try { app.setBackgroundColor("#f7f6f2"); } catch (e) {}
          }
          if (window.Telegram && window.Telegram.WebApp) {
            initTelegramShop();
          } else {
            var script = document.createElement("script");
            script.src = "https://telegram.org/js/telegram-web-app.js";
            script.async = true;
            script.onload = initTelegramShop;
            document.head.appendChild(script);
          }
        })();
      `}</Script>
      <main className="gallery-archive" style={{ paddingTop: "clamp(28px, 5vw, 64px)" }}>
        <div className="archive-mast">
          <span className="eyebrow">PETIT.SOT / {ru ? "МАГАЗИН" : "SHOP"}</span>
          <h1 style={{ fontSize: "clamp(58px, 12vw, 142px)", overflowWrap: "anywhere" }}>
            {ru ? "Работы" : "Artworks"}
          </h1>
          <p>{ru
            ? "Оригинальные работы Ольги Трихлеб. Выберите картину, чтобы узнать подробности и варианты приобретения."
            : "Original artworks by Olga Trikhleb. Select a painting to explore the details and purchase options."}</p>
        </div>

        <div className="archive-grid archive-grid-even">
          {works.map((work) => (
            <Link className="archive-card" href={"/works/" + work.slug} key={work.slug}>
              <div className="archive-image art-placeholder">
                {work.imageUrl
                  ? <img src={work.imageUrl} alt={ru ? work.titleRu : work.titleEn} loading="lazy" decoding="async" />
                  : <span>{ru ? "Нет изображения" : "Image unavailable"}</span>}
              </div>
              <div className="archive-card-meta">
                <span>{ru ? work.titleRu : work.titleEn}</span>
                <span>{work.year}</span>
              </div>
              <p>{localizeMedium(work.medium, ru ? "ru" : "en")}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 14, borderTop: "1px solid #c8c4bc", paddingTop: 12 }}>
                <span style={{ fontSize: 12 }}>{formatPrice(work.price, work.currency)}</span>
                <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em" }}>{ru ? "Подробнее ↗" : "View work ↗"}</span>
              </div>
            </Link>
          ))}
        </div>

        {works.length === 0 && (
          <div style={{ borderTop: "1px solid #aaa59d", padding: "42px 0 70px" }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 30, margin: "0 0 14px" }}>
              {ru ? "Новые работы скоро появятся." : "New works coming soon."}
            </p>
            <p style={{ maxWidth: 360, fontSize: 12, lineHeight: 1.6 }}>
              {ru ? "Напишите нам в Instagram, если хотите узнать о будущих работах." : "Follow us on Instagram for updates on upcoming works."}
            </p>
            <a className="purchase-button" style={{ maxWidth: 420, marginTop: 24 }} href="https://www.instagram.com/petit.sot.art/" target="_blank" rel="noreferrer">
              Instagram <span>↗</span>
            </a>
          </div>
        )}

        <div style={{ borderTop: "1px solid #aaa59d", marginTop: 24, paddingTop: 18, display: "flex", justifyContent: "space-between", gap: 18, fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em" }}>
          <span>{ru ? "Ольга Трихлеб" : "Olga Trikhleb"}</span>
          <Link href="/works" style={{ color: "inherit", textDecoration: "none" }}>{ru ? "Полный архив ↗" : "Full archive ↗"}</Link>
        </div>
      </main>
    </>
  );
}

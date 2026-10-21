"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Result = Record<string, any>;
type Artwork = { id: string; slug: string; title: string; title_en: string; status: string; price_eur: number; etsy_listing_id: number | null; etsy_state: string | null; ebay_listing_id: string | null; ebay_listing_url: string | null; ebay_state: string | null; ebay_error: string | null };

export default function EbayAdminPage() {
  const [status, setStatus] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [message, setMessage] = useState("");
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [publishing, setPublishing] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/ebay/status", { cache: "no-store" });
      const data = await response.json();
      setStatus(data);
      if (!response.ok) setMessage(data.error || "Не удалось проверить eBay.");
    } catch {
      setMessage("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadArtworks = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("petit_sot_artworks").select("id,slug,title,title_en,status,price_eur,etsy_listing_id,etsy_state,ebay_listing_id,ebay_listing_url,ebay_state,ebay_error").order("created_at", { ascending: true });
    setArtworks((data || []) as Artwork[]);
  }, []);

  useEffect(() => { void loadStatus(); void loadArtworks(); }, [loadStatus, loadArtworks]);

  async function setupNotifications() {
    setSettingUp(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/ebay/notifications/setup", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось настроить уведомления eBay.");
      setMessage("Уведомления eBay настроены: " + (data.subscription?.topicId || "ORDER_CONFIRMATION"));
      await loadStatus();
    } catch (error: any) {
      setMessage(String(error?.message || "Не удалось настроить уведомления eBay."));
    } finally {
      setSettingUp(false);
    }
  }

  const connected = status?.connected === true;

  async function publishArtwork(artwork: Artwork) {
    if (!window.confirm("Опубликовать картину «" + (artwork.title_en || artwork.title) + "» на eBay? Это создаст активное объявление.")) return;
    setPublishing(artwork.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/ebay/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ artworkId: artwork.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось опубликовать картину на eBay.");
      setMessage("Опубликовано на eBay: " + data.listingUrl);
      await loadArtworks();
    } catch (error: any) {
      setMessage(String(error?.message || "Не удалось опубликовать картину на eBay."));
      await loadArtworks();
    } finally {
      setPublishing("");
    }
  }

  return (
    <main className="admin-page" style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <span className="eyebrow">PETIT.SOT / ИНТЕГРАЦИИ</span>
          <h1 style={{ margin: "6px 0" }}>eBay</h1>
          <p style={{ margin: 0, opacity: 0.72 }}>Проверка подключения продавца и автоматических уведомлений о заказах.</p>
        </div>
        <a href="/admin" style={{ textDecoration: "underline" }}>← Назад в админку</a>
      </header>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Подключение</h2>
        <p>
          Статус: <strong>{loading ? "Проверяю…" : connected ? "Токен работает" : "Не подтверждено"}</strong>
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => void loadStatus()} disabled={loading} style={{ padding: "10px 14px" }}>
            {loading ? "Проверяю…" : "Проверить подключение"}
          </button>
          <a href="/api/ebay/oauth/start" style={{ padding: "10px 14px", border: "1px solid #aaa", borderRadius: 8 }}>
            Переподключить eBay с разрешениями для уведомлений
          </a>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Уведомления о заказах</h2>
        <p>После обновления разрешений eBay эта кнопка создаст endpoint и подписку на ORDER_CONFIRMATION.</p>
        <button type="button" onClick={() => void setupNotifications()} disabled={settingUp || !connected} style={{ padding: "10px 14px" }}>
          {settingUp ? "Настраиваю…" : "Настроить уведомления eBay"}
        </button>
      </section>

      {message ? <p role="status" style={{ padding: 12, background: "#f5f5f5", borderRadius: 8 }}>{message}</p> : null}

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Картины</h2>
        <p>Публикуй только после настройки marketplace, валюты, адреса отправки и бизнес-политик eBay. Каждая картина публикуется отдельно.</p>
        <div style={{ display: "grid", gap: 12 }}>
          {artworks.map(artwork => <article key={artwork.id} style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <strong>{artwork.title_en || artwork.title}</strong>
                <div style={{ fontSize: 13, opacity: 0.75 }}>€{Number(artwork.price_eur).toFixed(2)} · Etsy: {artwork.etsy_state || "не синхронизировано"} · eBay: {artwork.ebay_state || "нет объявления"}</div>
                {artwork.ebay_listing_url ? <a href={artwork.ebay_listing_url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Открыть объявление eBay</a> : null}
                {artwork.ebay_error ? <div style={{ color: "#a22", fontSize: 13 }}>{artwork.ebay_error}</div> : null}
              </div>
              {artwork.status === "available" && !artwork.ebay_listing_id ? <button type="button" disabled={!!publishing || !connected} onClick={() => void publishArtwork(artwork)} style={{ padding: "10px 14px" }}>{publishing === artwork.id ? "Публикую…" : "Опубликовать на eBay"}</button> : null}
            </div>
          </article>)}
        </div>
      </section>

      {status ? (
        <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Результат диагностики</h2>
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            {JSON.stringify(status, null, 2)}
          </pre>
        </section>
      ) : null}
    </main>
  );
}

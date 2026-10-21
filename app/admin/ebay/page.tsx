"use client";

import { useCallback, useEffect, useState } from "react";

type Result = Record<string, any>;

export default function EbayAdminPage() {
  const [status, setStatus] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [message, setMessage] = useState("");

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

  useEffect(() => { void loadStatus(); }, [loadStatus]);

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

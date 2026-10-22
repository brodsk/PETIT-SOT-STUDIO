"use client";

import { useEffect, useState } from "react";

type Status = {
  connected: boolean;
  appConfigured: boolean;
  accessLevel?: "trial" | "standard";
  apiMode?: "sandbox" | "production";
  expiresAt?: string | null;
  scope?: string | null;
  boards?: Record<string, string>;
  updatedAt?: string | null;
};

type Board = { name: string; id: string };

export default function PinterestDashboard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/pinterest/status", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Не удалось загрузить статус Pinterest.");
    setStatus(data);
    if (data.connected) {
      const boardResponse = await fetch("/api/admin/pinterest/boards", { cache: "no-store" });
      const boardData = await boardResponse.json().catch(() => ({}));
      if (!boardResponse.ok) throw new Error(boardData.error || "Не удалось загрузить доски Pinterest.");
      setBoards(boardData.boards || []);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) setMessage("Pinterest подключён.");
    if (params.get("error")) setError(params.get("error") || "Ошибка подключения.");
    load().catch((err) => setError(err?.message || "Ошибка загрузки."));
  }, []);

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <a href="/admin" className="admin-sidebar-brand"><img className="admin-sidebar-mark" src="/favicon.png" alt="PETITSOT" style={{ background: "transparent", borderRadius: 0, objectFit: "contain", padding: 0 }} /><span><strong>PETITSOT</strong><small>STUDIO ADMIN</small></span></a>
      <div className="admin-sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav className="admin-sidebar-nav">
        <a href="/admin"><span className="admin-nav-icon">▦</span><span>Коллекция</span></a>
        <a href="/admin/orders"><span className="admin-nav-icon">↗</span><span>Заказы</span></a>
        <a href="/api/admin/etsy/connect"><span className="admin-nav-icon">◎</span><span>Etsy</span></a>
        <a className="active" href="/admin/pinterest"><span className="admin-nav-icon">P</span><span>Pinterest</span></a>
      </nav>
      <div className="admin-sidebar-bottom"><a href="https://petitsot.com" target="_blank" rel="noreferrer"><span className="admin-nav-icon">↗</span><span>Открыть сайт</span></a></div>
    </aside>
    <div className="admin-main"><main className="admin-page">
      <header className="admin-top">
        <div className="admin-brand"><span className="eyebrow"><a href="/admin">PETITSOT</a> / ПРОДВИЖЕНИЕ</span><h1>Pinterest</h1></div>
        <nav><a href="/admin">Коллекция</a>{status?.connected ? <span className="eyebrow">АККАУНТ ПОДКЛЮЧЁН</span> : <a href="/api/admin/pinterest/connect">Подключить Pinterest ↗</a>}</nav>
      </header>
      <section className="admin-stats" aria-label="Pinterest status">
        <div className="admin-stat-card"><span>Подключение</span><strong>{status?.connected ? "Активно" : "Не подключено"}</strong><small>{status?.connected ? "OAuth авторизация сохранена" : "Нужно связать аккаунт"}</small></div>
        <div className="admin-stat-card"><span>Доски</span><strong>{boards.length || "—"}</strong><small>Одна общая доска для всех картин</small></div>
        <div className="admin-stat-card"><span>Публикация</span><strong>Вручную</strong><small>Выбираете каждую картину</small></div>
        <div className="admin-stat-card"><span>Переходы</span><strong>Сайт</strong><small>Каждый пин ведёт на страницу картины</small></div>
      </section>

      {status?.connected && status.apiMode === "sandbox" && <section className="admin-artwork-empty"><span>Включён Sandbox — демонстрационный режим</span><p>Пины создаются в тестовой среде Pinterest и видны только тебе. Это подходит для записи демонстрации заявки на Standard access; публичных публикаций в этом режиме не будет.</p><p>Если переключишь режим в Vercel, переподключи Pinterest, чтобы сохранить токен именно для выбранной среды.</p></section>}
      {status?.connected && status.apiMode !== "sandbox" && status.accessLevel !== "standard" && <section className="admin-artwork-empty"><span>Для демонстрации включи Sandbox</span><p>Сейчас запросы направляются в production API, а у приложения Trial access. В Vercel установи <code>PINTEREST_API_MODE=sandbox</code>, выполни redeploy и заново подключи Pinterest. Production-токен не подходит для Sandbox.</p><p>После одобрения Standard можно вернуть <code>PINTEREST_API_MODE=production</code> и установить <code>PINTEREST_ACCESS_LEVEL=standard</code>.</p><p><a href="https://developers.pinterest.com/apps/" target="_blank" rel="noreferrer">Открыть Pinterest Developers ↗</a></p></section>}

      {!status?.appConfigured && <section className="admin-artwork-empty"><span>Нужно зарегистрировать приложение Pinterest</span><p>Откройте Pinterest Developers, подключите приложение и добавьте в Vercel переменные PINTEREST_APP_ID и PINTEREST_APP_SECRET. Redirect URI должен быть ровно таким:</p><code>https://petitsot.com/api/admin/pinterest/callback</code><p><a href="https://developers.pinterest.com/apps/" target="_blank" rel="noreferrer">Открыть Pinterest Developers ↗</a></p></section>}

      {status?.appConfigured && !status.connected && <section className="admin-artwork-empty"><span>Подключите бизнес-аккаунт</span><p>После подключения публикации будут попадать на одну общую доску бренда.</p><a className="admin-new-artwork" href="/api/admin/pinterest/connect">Подключить Pinterest ↗</a></section>}

      {status?.connected && <section className="admin-artwork-grid">
        <div className="admin-gallery-toolbar"><div><span className="eyebrow">PETITSOT / PINTEREST</span><h2>Доска бренда</h2><p>Все картины публикуются на одной доске. Откройте нужную картину в разделе «Коллекция» и нажмите отдельную кнопку публикации в Pinterest — каждая работа отправляется только после вашего выбора.</p></div></div>
        <div className="admin-artwork-cards">{boards.map((board) => <div className="admin-artwork-card" key={board.id}><div className="admin-artwork-card-meta"><div><strong>{board.name}</strong><span>Доска Pinterest</span></div></div></div>)}</div>
        <p>Публикуются только картины со статусом «В продаже». Каждый пин ведёт на страницу конкретной картины на petitsot.com.</p>
      </section>}

      {message && <p className="admin-message">{message}</p>}
      {error && <p className="admin-message" role="alert">{error}</p>}
    </main></div>
  </div>;
}

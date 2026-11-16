"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Artwork = { id: string; slug: string; title: string; width_cm: number | null; height_cm: number | null; status: string };
type Variant = { id: string; artwork_id: string; prodigi_sku: string; size_label: string; width_mm: number; height_mm: number; retail_price_eur: number; active: boolean };
type PrintOrder = { id: string; prodigi_order_id: string | null; paypal_order_id: string | null; status_stage: string; paid_amount_eur: number | null; recipient: any; created_at: string; submitted_to_prodigi_at: string | null; fulfillment_error: string | null };

export default function PrintsAdmin({ artworks, initialVariants, initialOrders }: { artworks: Artwork[]; initialVariants: Variant[]; initialOrders: PrintOrder[] }) {
  const [variants, setVariants] = useState(initialVariants);
  const [artworkId, setArtworkId] = useState(artworks[0]?.id || "");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [quote, setQuote] = useState<any>(null);

  async function lookup() {
    setBusy(true); setMessage(""); setQuote(null);
    try {
      const response = await fetch("/api/admin/prints/catalogue?sku=" + encodeURIComponent(sku.trim()), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось проверить SKU.");
      setQuote(data);
      setMessage("SKU найден в Prodigi. Проверьте размер и стоимость перед сохранением.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка проверки SKU.");
    } finally { setBusy(false); }
  }

  async function save() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/prints/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId, sku: sku.trim(), retailPrice: Number(price) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось сохранить вариант.");
      setVariants(current => [data.variant, ...current]);
      setQuote(data);
      setMessage("Вариант сохранён выключенным. Он не появится на сайте, пока вы его не активируете.");
      setSku(""); setPrice("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка сохранения.");
    } finally { setBusy(false); }
  }

  async function toggle(variant: Variant) {
    setBusy(true); setMessage("");
    const supabase = createClient();
    const { data, error } = await supabase.from("petit_sot_print_variants")
      .update({ active: !variant.active }).eq("id", variant.id).select("*").single();
    if (error) setMessage("Не удалось изменить публикацию: " + error.message);
    else setVariants(current => current.map(item => item.id === variant.id ? data as Variant : item));
    setBusy(false);
  }

  async function remove(variant: Variant) {
    if (!window.confirm("Удалить этот вариант печати?")) return;
    setBusy(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.from("petit_sot_print_variants").delete().eq("id", variant.id);
    if (error) setMessage("Не удалось удалить вариант: " + error.message);
    else setVariants(current => current.filter(item => item.id !== variant.id));
    setBusy(false);
  }

  const selected = artworks.find(item => item.id === artworkId);
  return <main style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 22px", color: "var(--foreground, #222)" }}>
    <a href="/admin" style={{ color: "inherit", opacity: .65, textDecoration: "none" }}>← Админка</a>
    <header style={{ margin: "24px 0 32px" }}>
      <p style={{ letterSpacing: ".16em", fontSize: 11, opacity: .6 }}>PETIT.SOT / ADMIN</p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 34, margin: "8px 0" }}>Fine Art Prints</h1>
      <p style={{ opacity: .7, maxWidth: 680 }}>Добавление форматов из каталога Prodigi. Каждый размер проверяется по пропорциям оригинальной картины. Новые варианты сохраняются выключенными и не публикуются автоматически.</p>
    </header>
    <section style={{ border: "1px solid #ddd", padding: 22, borderRadius: 12, marginBottom: 30 }}>
      <h2 style={{ fontSize: 19, fontWeight: 500, marginTop: 0 }}>Добавить формат печати</h2>
      <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Картина</label>
      <select value={artworkId} onChange={e => { setArtworkId(e.target.value); setQuote(null); }} style={{ width: "100%", padding: 12, marginBottom: 14 }}>
        {artworks.map(item => <option key={item.id} value={item.id}>{item.title} — {item.width_cm} × {item.height_cm} cm ({item.status})</option>)}
      </select>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
        <div><label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Prodigi SKU</label><input value={sku} onChange={e => { setSku(e.target.value); setQuote(null); }} placeholder="Например, GLOBAL-FAP-..." style={{ width: "100%", padding: 12, boxSizing: "border-box" }}/></div>
        <div><label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Цена продажи (€)</label><input type="number" min="0.01" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Например, 29.90" style={{ width: "100%", padding: 12, boxSizing: "border-box" }}/></div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        <button disabled={busy || !sku.trim()} onClick={lookup} style={{ padding: "11px 18px" }}>Проверить SKU и стоимость Prodigi</button>
        <button disabled={busy || !quote || !selected || !price} onClick={save} style={{ padding: "11px 18px" }}>Сохранить как неактивный</button>
      </div>
      {quote && <div style={{ marginTop: 18, padding: 14, background: "rgba(127,127,127,.08)", borderRadius: 8 }}>
        <strong>{quote.product?.description || quote.product?.sku}</strong>
        <p style={{ marginBottom: 4 }}>SKU: {quote.product?.sku}</p>
        <p style={{ marginTop: 4 }}>Размер Prodigi: {quote.product?.productDimensions ? quote.product.productDimensions.width + " × " + quote.product.productDimensions.height + " " + quote.product.productDimensions.units : "—"}</p>
        <details><summary>Расчёт Prodigi (доставка в Словакию, Standard)</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 12 }}>{JSON.stringify(quote.quote, null, 2)}</pre></details>
      </div>}
      {message && <p role="status" style={{ marginBottom: 0, fontSize: 14 }}>{message}</p>}
      {selected && <p style={{ fontSize: 12, opacity: .65 }}>Пропорции картины: {selected.width_cm} × {selected.height_cm} cm. Форматы с другим соотношением сторон будут отклонены.</p>}
    </section>
    <section>
      <h2 style={{ fontSize: 20, fontWeight: 500 }}>Сохранённые варианты ({variants.length})</h2>
      {variants.length === 0 ? <p style={{ opacity: .65 }}>Пока вариантов нет.</p> : variants.map(item => {
        const artwork = artworks.find(work => work.id === item.artwork_id);
        return <article key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", padding: "16px 0", borderBottom: "1px solid #ddd" }}>
          <div><strong>{artwork?.title || "Картина"}</strong><div style={{ fontSize: 13, opacity: .7 }}>{item.size_label} · {item.width_mm} × {item.height_mm} mm · {item.prodigi_sku}</div><div style={{ fontSize: 13 }}>Цена: €{Number(item.retail_price_eur).toFixed(2)}</div></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, opacity: .7 }}>{item.active ? "Опубликован" : "Выключен"}</span>
            <button disabled={busy} onClick={() => toggle(item)}>{item.active ? "Выключить" : "Активировать"}</button>
            <button disabled={busy} onClick={() => remove(item)}>Удалить</button>
          </div>
        </article>;
      })}
    </section>
    <section style={{ marginTop: 42 }}>
      <h2 style={{ fontSize: 20, fontWeight: 500 }}>Заказы принтов ({initialOrders.length})</h2>
      {initialOrders.length === 0 ? <p style={{ opacity: .65 }}>Пока оплаченных заказов нет.</p> : initialOrders.map(order => {
        const address = order.recipient?.address || {};
        return <article key={order.id} style={{ padding: "16px 0", borderBottom: "1px solid #ddd" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <strong>{order.status_stage}</strong>
            <strong>{order.paid_amount_eur == null ? "—" : "€" + Number(order.paid_amount_eur).toFixed(2)}</strong>
          </div>
          <div style={{ fontSize: 13, opacity: .75, marginTop: 5 }}>{order.recipient?.name || "Получатель"} · {[address.line1,address.townOrCity,address.postalOrZipCode,address.countryCode].filter(Boolean).join(", ")}</div>
          <div style={{ fontSize: 12, opacity: .65, marginTop: 4 }}>PayPal: {order.paypal_order_id || "—"} · Prodigi: {order.prodigi_order_id || "ожидает отправки"}</div>
          <div style={{ fontSize: 12, opacity: .65 }}>{new Date(order.created_at).toLocaleString("en-GB")}</div>
          {order.fulfillment_error && <p style={{ color: "#9b3027", fontSize: 12 }}>{order.fulfillment_error}</p>}
        </article>;
      })}
    </section>
  </main>;
}

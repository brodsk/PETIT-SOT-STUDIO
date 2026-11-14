"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Order={id:string;status:string;buyer_name:string|null;buyer_email:string|null;amount_eur:number;created_at:string;artwork_id:string|null;shipping_address:any};
const statuses=["pending","paid","processing","shipped","completed","cancelled","refunded"];
const labels:Record<string,string>={pending:"Ожидает оплаты",paid:"Оплачен",processing:"В обработке",shipped:"Отправлен",completed:"Завершён",cancelled:"Отменён",refunded:"Возвращён"};

export default function OrdersAdmin(){
  const [orders,setOrders]=useState<Order[]>([]);
  const [busy,setBusy]=useState("");

  useEffect(()=>{
    const supabase=createClient();
    supabase
      .from("petit_sot_orders")
      .select("*")
      .order("created_at",{ascending:false})
      .then(({data})=>setOrders((data||[]) as Order[]));
  },[]);

  async function change(id:string,status:string){
    setBusy(id);
    const supabase=createClient();
    const {data,error}=await supabase
      .from("petit_sot_orders")
      .update({status})
      .eq("id",id)
      .select()
      .single();
    if(!error&&data)setOrders(x=>x.map(o=>o.id===id?data:o));
    setBusy("");
  }

  return <div className="studio-admin"><aside className="studio-sidebar"><a href="/admin" className="studio-brand"><img src="/favicon.png" alt=""/><span><b>PETIT.SOT</b><small>STUDIO / ADMIN</small></span></a><div className="studio-nav-caption">WORKSPACE</div><nav className="studio-nav"><a href="/admin"><span>⌂</span>Обзор</a><a href="/admin/artworks"><span>▧</span>Коллекция</a><a className="active" href="/admin/orders"><span>↗</span>Заказы</a><a href="/admin/commissions"><span>✳</span>Картины на заказ</a><a href="/admin/mail"><span>✉</span>Почта</a><a href="/api/admin/etsy/connect"><span>◎</span>Etsy</a></nav><div className="studio-sidebar-bottom"><a href="https://www.petitsot.com" target="_blank" rel="noreferrer"><span>↗</span>Открыть сайт</a><div>PETIT.SOT STUDIO <small>© 2026</small></div></div></aside><main className="admin-page studio-orders-main">
    <header className="admin-top"><div><span className="eyebrow">PETIT.SOT / АРХИВ</span><h1>Заказы</h1></div><nav><a href="/admin/artworks">Коллекция</a></nav></header>
    <section className="orders-table">
      {orders.length===0?<div className="orders-empty"><span>Заказов пока нет.</span><p>После подключения оплаты Stripe оплаченные покупки картин будут появляться здесь.</p></div>:orders.map(o=><article className="order-row" key={o.id}><div><span className="order-id">{o.id.slice(0,8).toUpperCase()}</span><h2>{o.buyer_name||"Покупатель не указан"}</h2><p>{o.buyer_email||"—"}</p></div><strong>€{Number(o.amount_eur).toFixed(2)}</strong><span>{new Date(o.created_at).toLocaleDateString("ru-RU")}</span><select aria-label="Статус заказа" value={o.status} disabled={busy===o.id} onChange={e=>change(o.id,e.target.value)}>{statuses.map(s=><option key={s} value={s}>{labels[s]||s}</option>)}</select></article>)}
    </section>
  </main></div>
}

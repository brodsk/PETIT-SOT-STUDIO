"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Order={id:string;status:string;buyer_name:string|null;buyer_email:string|null;amount_eur:number;created_at:string;artwork_id:string|null;shipping_address:any};
const statuses=["pending","paid","processing","shipped","completed","cancelled","refunded"];

export default function OrdersAdmin(){
  const supabase=createClient();
  const [orders,setOrders]=useState<Order[]>([]);
  const [busy,setBusy]=useState("");
  useEffect(()=>{supabase.from("petit_sot_orders").select("*").order("created_at",{ascending:false}).then(({data})=>setOrders((data||[]) as Order[]));},[]);
  async function change(id:string,status:string){
    setBusy(id); const {data,error}=await supabase.from("petit_sot_orders").update({status}).eq("id",id).select().single();
    if(!error&&data)setOrders(x=>x.map(o=>o.id===id?data:o)); setBusy("");
  }
  return <main className="admin-page">
    <header className="admin-top"><div><span className="eyebrow">PETIT.SOT / PRIVATE ARCHIVE</span><h1>Orders</h1></div><nav><a href="/admin">Works</a></nav></header>
    <section className="orders-table">
      {orders.length===0?<div className="orders-empty"><span>No orders yet.</span><p>When Stripe checkout is connected, paid artwork purchases will appear here.</p></div>:orders.map(o=><article className="order-row" key={o.id}><div><span className="order-id">{o.id.slice(0,8).toUpperCase()}</span><h2>{o.buyer_name||"Unnamed buyer"}</h2><p>{o.buyer_email||"—"}</p></div><strong>€{Number(o.amount_eur).toFixed(2)}</strong><span>{new Date(o.created_at).toLocaleDateString()}</span><select value={o.status} disabled={busy===o.id} onChange={e=>change(o.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></article>)}
    </section>
  </main>
}

import Link from "next/link";
import { requireAdmin } from "../../lib/admin";
export const dynamic="force-dynamic";
const money=(v:number)=>new Intl.NumberFormat("en-IE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(v||0);
export default async function AdminOverviewPage(){
 const {supabase}=await requireAdmin();
 const [a,o,c]=await Promise.all([
  supabase.from("petit_sot_artworks").select("id,title,status,price_eur,thumbnail_path,web_image_path,image_path").order("created_at",{ascending:false}),
  supabase.from("petit_sot_orders").select("id,status,buyer_name,buyer_email,amount_eur,created_at").order("created_at",{ascending:false}).limit(100),
  supabase.from("petit_sot_commissions").select("id,status,customer_name,reference_code,created_at").order("created_at",{ascending:false}).limit(100)
 ]);
 const works=a.data||[],orders=o.data||[],requests=c.data||[];
 const available=works.filter(x=>x.status==="available").length,sold=works.filter(x=>x.status==="sold").length,drafts=works.filter(x=>x.status==="draft").length;
 const active=orders.filter(x=>["pending","paid","processing"].includes(x.status)).length;
 const newRequests=requests.filter(x=>["new","reviewing"].includes(x.status)).length;
 const revenue=orders.filter(x=>["paid","processing","shipped","completed"].includes(x.status)).reduce((n,x)=>n+Number(x.amount_eur||0),0);
 return <div className="studio-admin">
 <aside className="studio-sidebar"><Link href="/admin" className="studio-brand"><img src="/favicon.png" alt=""/><span><b>PETIT.SOT</b><small>STUDIO / ADMIN</small></span></Link><div className="studio-nav-caption">WORKSPACE</div><nav className="studio-nav">
 <Link className="active" href="/admin"><span>⌂</span>Обзор</Link><Link href="/admin/artworks"><span>▧</span>Коллекция <em>{works.length}</em></Link><Link href="/admin/orders"><span>↗</span>Заказы {active>0&&<em>{active}</em>}</Link><Link href="/admin/commissions"><span>✳</span>Картины на заказ {newRequests>0&&<em>{newRequests}</em>}</Link><Link href="/admin/mail"><span>✉</span>Почта</Link><a href="/api/admin/etsy/connect"><span>◎</span>Etsy</a></nav>
 <div className="studio-sidebar-bottom"><a href="https://www.petitsot.com" target="_blank" rel="noreferrer"><span>↗</span>Открыть сайт</a><div>PETIT.SOT STUDIO <small>© 2026</small></div></div></aside>
 <main className="studio-main"><header className="studio-header"><div><span className="studio-kicker">PETIT.SOT / STUDIO OVERVIEW</span><h1>Добро пожаловать в студию</h1><p>Рабочее пространство PETIT.SOT · {new Intl.DateTimeFormat("ru-RU",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(new Date())}</p></div><Link className="studio-view-site" href="https://www.petitsot.com" target="_blank">Смотреть сайт ↗</Link></header>
 <section className="studio-section-head"><div><span className="studio-kicker">AT A GLANCE</span><h2>Сводка студии</h2></div><span className="studio-live"><i/> Данные обновлены</span></section>
 <section className="studio-metrics"><article className="studio-metric studio-metric-dark"><span>Работы в коллекции</span><strong>{works.length}</strong><small>Всего произведений</small><b>↗</b></article><article className="studio-metric"><span>В продаже</span><strong>{available}</strong><small>Опубликованные картины</small><b>↗</b></article><article className="studio-metric"><span>Заказы</span><strong>{orders.length}</strong><small>{active} требуют внимания</small><b>↗</b></article><article className="studio-metric"><span>Выручка по заказам</span><strong>{money(revenue)}</strong><small>Оплаченные заказы</small><b>↗</b></article></section>
 <section className="studio-lower-grid"><div className="studio-panel studio-recent"><div className="studio-panel-head"><div><span className="studio-kicker">LATEST WORK</span><h3>Последние картины</h3></div><Link href="/admin/artworks">Вся коллекция ↗</Link></div>
 {works.slice(0,5).map(w=><div className="studio-art-row" key={w.id}><div className="studio-art-thumb">{w.image_path&&<img src={supabase.storage.from("petit-sot-artworks").getPublicUrl(w.thumbnail_path||w.web_image_path||w.image_path).data.publicUrl} alt=""/>}</div><div className="studio-art-info"><b>{w.title||"Без названия"}</b><small>{w.status==="available"?"В продаже":w.status==="sold"?"Продана":w.status==="draft"?"Черновик":w.status==="archived"?"Архив":w.status}</small></div><strong>{w.price_eur?money(Number(w.price_eur)):"—"}</strong></div>)}
 {!works.length&&<p className="studio-empty">Коллекция пока пуста.</p>}</div>
 <div className="studio-side-stack"><div className="studio-panel studio-quick"><span className="studio-kicker">QUICK ACTIONS</span><h3>Быстрый доступ</h3><Link href="/admin/artworks?new=1"><span>＋</span><div><b>Добавить картину</b><small>Новая работа в коллекцию</small></div><i>↗</i></Link><Link href="/admin/orders"><span>↗</span><div><b>Проверить заказы</b><small>{active} активных заказов</small></div><i>↗</i></Link><Link href="/admin/mail"><span>✉</span><div><b>Открыть почту</b><small>Переписка с клиентами</small></div><i>↗</i></Link></div>
 <div className="studio-panel studio-health"><span className="studio-kicker">COLLECTION STATUS</span><h3>Состояние коллекции</h3>{[["Проданы",sold],["Черновики",drafts],["В продаже",available]].map(([label,n])=><div className="studio-progress" key={label}><span>{label}</span><b>{n}</b><i><em style={{width:works.length?String(Number(n)/works.length*100)+"%":"0%"}}/></i></div>)}</div></div></section>
 <footer className="studio-footer">PETIT.SOT STUDIO <span>Made for art, with care.</span></footer></main></div>;
}
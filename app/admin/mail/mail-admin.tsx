"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Folder={folderId:string;folderName:string;folderType:string};
type Message={messageId:string;subject?:string;fromAddress?:string;toAddress?:string;sender?:string;receivedTime?:number|string;sentTime?:number|string;summary?:string;hasAttachment?:boolean;status?:string;isRead?:boolean;[key:string]:any};

function address(value:any) {
  if(typeof value==="string")return value;
  if(Array.isArray(value))return value.map((x:any)=>x.address||x.email||x).join(", ");
  return value?.address||value?.email||"";
}
function dateLabel(value:any) {
  if(!value)return "";
  const n=Number(value);
  const date=new Date(n>1e12?n:n>1e9?n*1000:value);
  return Number.isNaN(date.getTime())?"":date.toLocaleString("ru-RU",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
}

export default function MailAdmin({initialConnected,initialEmail}:{initialConnected:boolean;initialEmail:string|null}) {
  const [connected,setConnected]=useState(initialConnected);
  const [accountEmail,setAccountEmail]=useState(initialEmail||"");
  const [folders,setFolders]=useState<Folder[]>([]);
  const [messages,setMessages]=useState<Message[]>([]);
  const [folderId,setFolderId]=useState("");
  const [selected,setSelected]=useState<Message|null>(null);
  const [messageBody,setMessageBody]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [compose,setCompose]=useState(false);
  const [to,setTo]=useState("");
  const [subject,setSubject]=useState("");
  const [body,setBody]=useState("");
  const [sending,setSending]=useState(false);
  const [search,setSearch]=useState("");

  const currentFolder=useMemo(()=>folders.find(f=>String(f.folderId)===folderId),[folders,folderId]);
  const load=useCallback(async(nextFolder?:string)=>{
    setLoading(true);setError("");
    try {
      const query=nextFolder?("?folder="+encodeURIComponent(nextFolder)):"";
      const response=await fetch("/api/admin/mail/messages"+query,{cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Не удалось загрузить почту.");
      setConnected(Boolean(data.connected));
      if(data.accountEmail)setAccountEmail(data.accountEmail);
      setFolders(data.folders||[]);
      setMessages(data.messages||[]);
      if(data.selectedFolder)setFolderId(String(data.selectedFolder.folderId));
      setSelected(null);setMessageBody("");
    } catch(e:any){setError(e.message||"Ошибка загрузки почты.");}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("connected"))setNotice("Zoho Mail подключён.");
    if(params.get("error"))setError("Zoho: "+params.get("error"));
    if(initialConnected)load();
  },[initialConnected,load]);

  async function openMessage(message:Message) {
    setSelected(message);setMessageBody("");setCompose(false);setError("");
    try {
      const response=await fetch("/api/admin/mail/message?"+new URLSearchParams({folderId,messageId:String(message.messageId)}));
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Не удалось открыть письмо.");
      const item=data.data;
      setMessageBody(item?.content||item?.data?.content||item?.messageContent||item?.summary||message.summary||"Содержимое письма недоступно.");
    } catch(e:any){setError(e.message||"Не удалось открыть письмо.");}
  }

  async function send(e:React.FormEvent) {
    e.preventDefault();setSending(true);setError("");setNotice("");
    try {
      const html=body.split(/\n{2,}/).map(p=>"<p>"+p.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>")+"</p>").join("");
      const response=await fetch("/api/admin/mail/messages",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({to,subject,content:html})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Не удалось отправить письмо.");
      setNotice("Письмо отправлено.");
      setCompose(false);setTo("");setSubject("");setBody("");
      const sent=folders.find(f=>f.folderType?.toLowerCase()==="sent");
      if(sent)await load(String(sent.folderId));
    } catch(e:any){setError(e.message||"Ошибка отправки.");}
    finally{setSending(false);}
  }

  const filtered=messages.filter(m=>[m.subject,address(m.fromAddress||m.sender),m.summary].join(" ").toLowerCase().includes(search.toLowerCase()));
  const sender=selected?address(selected.fromAddress||selected.sender):"";

  return <div className="admin-shell mail-shell">
    <aside className="admin-sidebar">
      <a href="/admin" className="admin-sidebar-brand"><img className="admin-sidebar-mark" src="/favicon.png" alt="PETIT.SOT"/><span><strong>PETIT.SOT</strong><small>STUDIO ADMIN</small></span></a>
      <div className="admin-sidebar-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav className="admin-sidebar-nav">
        <a href="/admin"><span className="admin-nav-icon">▦</span><span>Коллекция</span></a>
        <a href="/admin/orders"><span className="admin-nav-icon">↗</span><span>Заказы</span></a>
        <a href="/admin/commissions"><span className="admin-nav-icon">✦</span><span>Картины на заказ</span></a>
        <a className="active" href="/admin/mail"><span className="admin-nav-icon">✉</span><span>Почта</span></a>
        <a href="/api/admin/etsy/connect"><span className="admin-nav-icon">◎</span><span>Etsy</span></a>
      </nav>
      <div className="admin-sidebar-bottom"><a href="https://www.petitsot.com" target="_blank" rel="noreferrer"><span className="admin-nav-icon">↗</span><span>Открыть сайт</span></a></div>
      <div className="admin-sidebar-footer">PETIT.SOT STUDIO <span>© 2026</span></div>
    </aside>
    <div className="admin-main"><main className="admin-page mail-page">
      <header className="admin-top"><div><span className="eyebrow">PETIT.SOT / COMMUNICATION</span><h1>Почта</h1><p className="admin-top-subtitle">{accountEmail||"Рабочий почтовый ящик студии"}</p></div><div className="mail-head-actions">{connected&&<button className="mail-compose" onClick={()=>{setCompose(true);setSelected(null);setError("");}}>+ Написать письмо</button>}</div></header>
      {notice&&<p className="mail-notice">{notice}</p>}
      {error&&<p className="mail-error">{error}</p>}
      {!connected?<section className="mail-connect-card"><span className="eyebrow">ZOHO MAIL · EU</span><h2>Подключите почту студии</h2><p>Безопасное подключение к Zoho Mail. Письма и токены остаются на сервере.</p><a href="/api/admin/mail/connect">Подключить Zoho Mail ↗</a></section>:
      <section className="mail-workspace">
        <aside className="mail-folders"><div className="mail-folder-heading">ПАПКИ</div>{folders.map(folder=><button key={folder.folderId} className={String(folder.folderId)===folderId?"active":""} onClick={()=>{setFolderId(String(folder.folderId));load(String(folder.folderId));}}><span>{folder.folderType?.toLowerCase()==="inbox"?"↙":folder.folderType?.toLowerCase()==="sent"?"↗":"▤"}</span>{folder.folderName}</button>)}</aside>
        <section className="mail-list-panel">
          <div className="mail-list-top"><div><span className="eyebrow">{currentFolder?.folderName||"ВХОДЯЩИЕ"}</span><strong>{filtered.length}</strong></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск в письмах…"/><button onClick={()=>load(folderId)} disabled={loading} aria-label="Обновить">↻</button></div>
          <div className="mail-list">{loading?<p className="mail-empty">Загружаю письма…</p>:filtered.length?filtered.map((message,index)=><button key={message.messageId||index} className={"mail-row "+(selected?.messageId===message.messageId?"selected":"")} onClick={()=>openMessage(message)}><span className="mail-row-top"><strong>{address(message.fromAddress||message.sender)||"Без отправителя"}</strong><time>{dateLabel(message.receivedTime||message.sentTime)}</time></span><span className="mail-row-subject">{message.subject||"(без темы)"}</span><span className="mail-row-preview">{message.summary||"Открыть письмо"}</span></button>):<p className="mail-empty">{search?"Ничего не найдено.":"В этой папке пока нет писем."}</p>}</div>
        </section>
        <section className="mail-reading-panel">
          {compose?<form className="mail-compose-form" onSubmit={send}><div className="mail-reading-head"><span className="eyebrow">НОВОЕ СООБЩЕНИЕ</span><button type="button" onClick={()=>setCompose(false)}>×</button></div><label>Кому<input type="email" required value={to} onChange={e=>setTo(e.target.value)} placeholder="client@example.com"/></label><label>Тема<input required value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Тема письма"/></label><label>Сообщение<textarea required rows={12} value={body} onChange={e=>setBody(e.target.value)} placeholder="Здравствуйте!"/></label><div className="mail-signature">PETIT.SOT STUDIO <span>Original art by Olga Trikhleb</span></div><button className="mail-send" disabled={sending}>{sending?"Отправляю…":"Отправить письмо ↗"}</button></form>:selected?<article className="mail-message-view"><div className="mail-reading-head"><span className="eyebrow">СООБЩЕНИЕ</span><button onClick={()=>{setSelected(null);setMessageBody("");}}>×</button></div><h2>{selected.subject||"(без темы)"}</h2><div className="mail-message-meta"><strong>{sender}</strong><span>{dateLabel(selected.receivedTime||selected.sentTime)}</span></div><div className="mail-message-content">{messageBody||"Загружаю содержимое…"}</div><button className="mail-reply" onClick={()=>{setCompose(true);setTo(sender);setSubject("Re: "+(selected?.subject||""));setBody("\n\n—\nPETIT.SOT STUDIO");setSelected(null);}}>Ответить ↗</button></article>:<div className="mail-placeholder"><span>✉</span><h2>Ваша переписка</h2><p>Выберите письмо слева или создайте новое сообщение.</p></div>}
        </section>
      </section>}
    </main></div>
  </div>;
}

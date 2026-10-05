"use client";

import {FormEvent, useState} from "react";

export default function ContactForm({ru}:{ru:boolean}){
  const [status,setStatus]=useState<"idle"|"sending"|"sent"|"error">("idle");

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(status==="sending")return;
    const form=e.currentTarget;
    const data=new FormData(form);
    setStatus("sending");
    try{
      const res=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        name:String(data.get("name")||"").trim(),
        email:String(data.get("email")||"").trim(),
        message:String(data.get("message")||"").trim(),
        website:String(data.get("website")||"").trim(),
      })});
      if(!res.ok)throw new Error("Request failed");
      form.reset();
      setStatus("sent");
    }catch{
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-honeypot" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      </div>
      <label>
        <span>{ru?"Имя":"Name"}</span>
        <input name="name" type="text" required maxLength={80} autoComplete="name"/>
      </label>
      <label>
        <span>Email</span>
        <input name="email" type="email" required maxLength={160} autoComplete="email"/>
      </label>
      <label>
        <span>{ru?"Сообщение":"Message"}</span>
        <textarea name="message" required maxLength={4000} rows={6}/>
      </label>
      <button type="submit" disabled={status==="sending"}>
        <span>{status==="sending"?(ru?"Отправка…":"Sending…"):(ru?"Отправить":"Send")}</span>
        <strong>↗</strong>
      </button>
      {status==="sent"&&<p className="contact-form-status success">{ru?"Сообщение отправлено. Спасибо.":"Message sent. Thank you."}</p>}
      {status==="error"&&<p className="contact-form-status error">{ru?"Не удалось отправить сообщение. Попробуйте ещё раз.":"Something went wrong. Please try again."}</p>}
    </form>
  );
}


"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Artwork={id:string;slug:string;title:string;year:number|null;medium:string|null;width_cm:number|null;height_cm:number|null;depth_cm:number|null;description:string;ai_description:string;price_eur:number;status:string;image_path:string|null;certificate_number:string|null;created_at:string};
type Props={initialArtworks:Artwork[]};

export default function AdminDashboard({initialArtworks}:Props){
  const supabase=createClient();
  const [artworks,setArtworks]=useState(initialArtworks);
  const [selected,setSelected]=useState<Artwork|null>(null);
  const [image,setImage]=useState<File|null>(null);
  const [imagePreview,setImagePreview]=useState("");
  const [busy,setBusy]=useState(false);
  const [aiBusy,setAiBusy]=useState(false);
  const [message,setMessage]=useState("");

  const form=selected ?? {id:"",slug:"",title:"",year:new Date().getFullYear(),medium:"",width_cm:null,height_cm:null,depth_cm:null,description:"",ai_description:"",price_eur:0,status:"draft",image_path:null,certificate_number:null,created_at:""};
  const imageUrl=useMemo(()=>form.image_path?supabase.storage.from("petit-sot-artworks").getPublicUrl(form.image_path).data.publicUrl:"",[form.image_path,supabase]);

  function patch(key:string,value:any){setSelected({...form,[key]:value} as Artwork);}

  function chooseImage(file:File|null){
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
    setMessage("");
  }

  async function save(e:FormEvent){
    e.preventDefault(); setBusy(true); setMessage("");
    try{
      let imagePath=form.image_path;
      if(image){
        const ext=image.name.split(".").pop()?.toLowerCase()||"jpg";
        imagePath=(form.slug||crypto.randomUUID())+"."+ext;
        const up=await supabase.storage.from("petit-sot-artworks").upload(imagePath,image,{contentType:image.type,upsert:true});
        if(up.error) throw up.error;
      }
      const payload={slug:form.slug,title:form.title,year:form.year||null,medium:form.medium||null,width_cm:form.width_cm||null,height_cm:form.height_cm||null,depth_cm:form.depth_cm||null,description:form.description,ai_description:form.ai_description,price_eur:Number(form.price_eur)||0,status:form.status,image_path:imagePath||null};
      const result=form.id
        ? await supabase.from("petit_sot_artworks").update(payload).eq("id",form.id).select().single()
        : await supabase.from("petit_sot_artworks").insert(payload).select().single();
      if(result.error) throw result.error;
      setArtworks(prev=>form.id?prev.map(x=>x.id===form.id?result.data:x):[result.data,...prev]);
      setSelected(result.data); setImage(null); setImagePreview(""); setMessage("Сохранено.");
    }catch(err:any){setMessage(err?.message||"Не удалось сохранить.");}
    setBusy(false);
  }

  async function compressImage(source:Blob){
    const bitmap=await createImageBitmap(source);
    const max=1800;
    const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext("2d")!.drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg",0.82);
  }

  async function generateDescription(){
    if(!image && !form.image_path){setMessage("Сначала добавьте изображение картины.");return;}
    setAiBusy(true);setMessage("");
    try{
      let dataUrl="";
      if(image){
        dataUrl=await compressImage(image);
      }else{
        const res=await fetch(imageUrl);
        if(!res.ok) throw new Error("Не удалось прочитать загруженное изображение.");
        const blob=await res.blob();
        dataUrl=await compressImage(blob);
      }
      const res=await fetch("/api/admin/generate-description",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({imageDataUrl:dataUrl,title:form.title,medium:form.medium,year:form.year,width_cm:form.width_cm,height_cm:form.height_cm,depth_cm:form.depth_cm})});
      const json=await res.json(); if(!res.ok) throw new Error([json.error,json.detail].filter(Boolean).join(" ")||"Не удалось создать описание.");
      setSelected({...form,description:json.description,ai_description:json.description} as Artwork); setMessage("Описание создано. При необходимости отредактируйте его и сохраните.");
    }catch(err:any){setMessage(err?.message||"Не удалось создать описание.");}
    setAiBusy(false);
  }

  async function passport(){
    if(!form.id){setMessage("Сначала сохраните картину.");return;}
    const res=await fetch("/api/admin/certificate/"+form.id);
    if(!res.ok){const j=await res.json().catch(()=>({}));setMessage(j.error||"Не удалось создать паспорт.");return;}
    const blob=await res.blob(); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=(form.slug||"artwork")+"-passport.pdf"; a.click(); URL.revokeObjectURL(url);
  }

  async function logout(){await supabase.auth.signOut();location.href="/admin/login";}

  return <main className="admin-page">
    <header className="admin-top"><div><span className="eyebrow">PETIT.SOT / АРХИВ</span><h1>Картины</h1></div><nav><a href="/admin/orders">Заказы</a><button onClick={logout}>Выйти</button></nav></header>
    <section className="admin-layout">
      <aside className="admin-list">
        <button className="admin-new" onClick={()=>{setSelected(null);setImage(null);setImagePreview("");setMessage("");}}>+ Новая картина</button>
        {artworks.map(w=><button key={w.id} className={"admin-list-row "+(form.id===w.id?"active":"")} onClick={()=>{setSelected(w);setImage(null);setImagePreview("");setMessage("");}}><span>{w.title||"Без названия"}</span><small>{({draft:"Черновик",available:"В продаже",sold:"Продана",archived:"Архив"} as Record<string,string>)[w.status]||w.status}</small></button>)}
      </aside>
      <section className="admin-editor">
        <form onSubmit={save}>
          <div className="admin-editor-head"><div><span className="eyebrow">КАРТИНА</span><h2>{form.title||"Новая работа"}</h2></div><select aria-label="Статус" value={form.status} onChange={e=>patch("status",e.target.value)}><option value="draft">Черновик</option><option value="available">В продаже</option><option value="sold">Продана</option><option value="archived">Архив</option></select></div>
          <div className="admin-image-field">
            {imagePreview ? <img src={imagePreview} alt="" /> : imageUrl ? <img src={imageUrl} alt="" /> : <div><span>Изображение картины</span><small>JPG / PNG / WEBP · максимум 15 МБ</small></div>}
            <label>{image ? "Заменить изображение" : "Выбрать изображение"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>chooseImage(e.target.files?.[0]||null)}/></label>
            {image && <p className="admin-file-name">{image.name}</p>}
          </div>
          <div className="admin-form-grid">
            <label>Название<input value={form.title} onChange={e=>patch("title",e.target.value)} required/></label>
            <label>Адрес страницы (Slug)<input value={form.slug} onChange={e=>patch("slug",e.target.value)} placeholder="например, untitled-i" required/></label>
            <label>Год<input type="number" value={form.year??""} onChange={e=>patch("year",Number(e.target.value)||null)}/></label>
            <label>Материал / техника<input value={form.medium??""} onChange={e=>patch("medium",e.target.value)} placeholder="например, масло на холсте"/></label>
            <label>Ширина / см<input type="number" step="0.1" value={form.width_cm??""} onChange={e=>patch("width_cm",Number(e.target.value)||null)}/></label>
            <label>Высота / см<input type="number" step="0.1" value={form.height_cm??""} onChange={e=>patch("height_cm",Number(e.target.value)||null)}/></label>
            <label>Глубина / см<input type="number" step="0.1" value={form.depth_cm??""} onChange={e=>patch("depth_cm",Number(e.target.value)||null)}/></label>
            <label>Цена / EUR<input type="number" step="0.01" min="0" value={form.price_eur===0?"":form.price_eur} onChange={e=>patch("price_eur",e.target.value===""?0:Number(e.target.value))}/></label>
          </div>
          <div className="admin-description-head"><label>Описание<textarea value={form.description} onChange={e=>patch("description",e.target.value)} rows={8}/></label><div><button type="button" className="ai-button" onClick={generateDescription} disabled={aiBusy}>{aiBusy?"Анализирую картину…":"✦ Создать описание с ИИ"}</button><p>ИИ анализирует само изображение и использует указанные выше данные. Он не придумывает год, технику или размеры.</p></div></div>
          {message && <p className="admin-message">{message}</p>}
          <div className="admin-actions"><button type="submit" disabled={busy}>{busy?"Сохраняю…":"Сохранить картину"} <span>↗</span></button>{form.id&&<button type="button" className="secondary" onClick={passport}>Создать паспорт PDF</button>}</div>
        </form>
      </section>
    </section>
  </main>
}

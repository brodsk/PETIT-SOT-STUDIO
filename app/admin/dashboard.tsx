"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Artwork={id:string;slug:string;title:string;title_en:string;year:number|null;medium:string|null;width_cm:number|null;height_cm:number|null;depth_cm:number|null;description:string;description_en:string;ai_description:string;price_eur:number;status:string;image_path:string|null;certificate_number:string|null;created_at:string;etsy_listing_id:number|null;etsy_state:string|null;etsy_error:string|null;etsy_listing_url:string|null};
type ArtworkImage={id:string;artwork_id:string;image_path:string;sort_order:number;created_at:string};
type InteriorImage={id:string;artwork_id:string;image_path:string;style:string;custom_prompt:string;created_at:string;image_url:string};
type Props={initialArtworks:Artwork[]};

export default function AdminDashboard({initialArtworks}:Props){
  const supabase=createClient();
  const [artworks,setArtworks]=useState(initialArtworks);
  const [selected,setSelected]=useState<Artwork|null>(null);
  const [image,setImage]=useState<File|null>(null);
  const [imagePreview,setImagePreview]=useState("");
  const [galleryImages,setGalleryImages]=useState<ArtworkImage[]>([]);
  const [newImages,setNewImages]=useState<File[]>([]);
  const [busy,setBusy]=useState(false);
  const [aiBusy,setAiBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [etsy,setEtsy]=useState<{connected:boolean;shop_name?:string|null;etsy_shop_id?:number|null}|null>(null);
  const [etsyImporting,setEtsyImporting]=useState(false);
  const [etsyProgress,setEtsyProgress]=useState("");

  const form=selected ?? {id:"",slug:"",title:"",title_en:"",year:new Date().getFullYear(),medium:"",width_cm:null,height_cm:null,depth_cm:null,description:"",description_en:"",ai_description:"",price_eur:0,status:"available",image_path:null,certificate_number:null,created_at:""};
  const imageUrl=useMemo(()=>form.image_path?supabase.storage.from("petit-sot-artworks").getPublicUrl(form.image_path).data.publicUrl:"",[form.image_path,supabase]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const etsyError=params.get("etsy")==="error"?params.get("reason"):"";
    if(etsyError)setMessage("Etsy: "+etsyError);
    fetch("/api/admin/etsy/status",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{if(data?.connected)setEtsy({connected:true,...data.connection});else setEtsy({connected:false});}).catch(()=>setEtsy({connected:false}));
  },[]);

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      if(!form.id){setGalleryImages([]);return;}
      const {data,error}=await supabase.from("petit_sot_artwork_images").select("*").eq("artwork_id",form.id).order("sort_order",{ascending:true});
      if(!cancelled)setGalleryImages(error?[]:(data||[]));
    }
    load();
    return ()=>{cancelled=true};
  },[form.id,supabase]);

  function patch(key:string,value:any){setSelected({...form,[key]:value} as Artwork);}
  function chooseImage(file:File|null){setImage(file);setImagePreview(file ? URL.createObjectURL(file) : "");setMessage("");}
  async function chooseGalleryImages(files:FileList|null){
    if(!files)return;
    const selectedFiles=Array.from(files);
    if(!form.id){setNewImages(prev=>[...prev,...selectedFiles]);setMessage("Фото добавлены в список и загрузятся после сохранения картины.");return;}
    setBusy(true);setMessage("");
    try{
      const rows:any[]=[];
      const start=galleryImages.length;
      for(let i=0;i<selectedFiles.length;i++){
        const file=selectedFiles[i];
        const ext=file.name.split(".").pop()?.toLowerCase()||"jpg";
        const path=form.id+"/"+crypto.randomUUID()+"."+ext;
        const up=await supabase.storage.from("petit-sot-artworks").upload(path,file,{contentType:file.type,upsert:false});
        if(up.error)throw up.error;
        rows.push({artwork_id:form.id,image_path:path,sort_order:start+i});
      }
      const inserted=await supabase.from("petit_sot_artwork_images").insert(rows).select("*");
      if(inserted.error)throw inserted.error;
      setGalleryImages(prev=>[...prev,...(inserted.data||[])]);
      setMessage(selectedFiles.length===1?"Фото добавлено в галерею.":`Добавлено фотографий: ${selectedFiles.length}.`);
    }catch(err:any){setMessage(err?.message||"Не удалось загрузить фото.");}
    setBusy(false);
  }

  async function save(e:FormEvent){
    e.preventDefault();setBusy(true);setMessage("");
    try{
      let imagePath=form.image_path;
      if(image){
        const ext=image.name.split(".").pop()?.toLowerCase()||"jpg";
        imagePath=(form.slug||crypto.randomUUID())+"."+ext;
        const up=await supabase.storage.from("petit-sot-artworks").upload(imagePath,image,{contentType:image.type,upsert:true});
        if(up.error)throw up.error;
      }
      let titleEn=form.title_en||"";
      let descriptionEn=form.description_en||"";
      if(form.title||form.description){
        const tr=await fetch("/api/admin/translate-artwork",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({title:form.title,description:form.description})});
        const tj=await tr.json();
        if(!tr.ok)throw new Error(tj.error||"Не удалось перевести работу на английский.");
        titleEn=tj.titleEn||titleEn;descriptionEn=tj.descriptionEn||descriptionEn;
      }
      const payload={slug:form.slug,title:form.title,title_en:titleEn,year:form.year||null,medium:form.medium||null,width_cm:form.width_cm||null,height_cm:form.height_cm||null,depth_cm:form.depth_cm||null,description:form.description,description_en:descriptionEn,ai_description:form.ai_description,price_eur:Number(form.price_eur)||0,status:form.status,image_path:imagePath||null};
      const result=form.id?await supabase.from("petit_sot_artworks").update(payload).eq("id",form.id).select().single():await supabase.from("petit_sot_artworks").insert(payload).select().single();
      if(result.error)throw result.error;
      const saved=result.data as Artwork;
      if(newImages.length){
        const rows:any[]=[];
        for(let i=0;i<newImages.length;i++){
          const file=newImages[i],ext=file.name.split(".").pop()?.toLowerCase()||"jpg",path=saved.id+"/"+crypto.randomUUID()+"."+ext;
          const up=await supabase.storage.from("petit-sot-artworks").upload(path,file,{contentType:file.type,upsert:false});
          if(up.error)throw up.error;
          rows.push({artwork_id:saved.id,image_path:path,sort_order:galleryImages.length+i});
        }
        const inserted=await supabase.from("petit_sot_artwork_images").insert(rows);
        if(inserted.error)throw inserted.error;
      }
      const {data:gallery,error:galleryError}=await supabase.from("petit_sot_artwork_images").select("*").eq("artwork_id",saved.id).order("sort_order",{ascending:true});
      if(galleryError)throw galleryError;
      setGalleryImages(gallery||[]);
      setArtworks(prev=>form.id?prev.map(x=>x.id===form.id?saved:x):[saved,...prev]);setSelected(saved);setImage(null);setImagePreview("");setNewImages([]);setMessage("Сохранено. Английская версия обновлена.");
    }catch(err:any){setMessage(err?.message||"Не удалось сохранить.");}
    setBusy(false);
  }

  async function makeGalleryImageMain(item:ArtworkImage){
    if(!form.id||!form.image_path||item.image_path===form.image_path)return;
    setBusy(true);setMessage("");
    try{
      const oldMain=form.image_path;
      const {error:galleryError}=await supabase.from("petit_sot_artwork_images").update({image_path:oldMain}).eq("id",item.id);
      if(galleryError)throw galleryError;
      const {data,error}=await supabase.from("petit_sot_artworks").update({image_path:item.image_path}).eq("id",form.id).select().single();
      if(error)throw error;
      setSelected(data as Artwork);
      setGalleryImages(prev=>prev.map(x=>x.id===item.id?{...x,image_path:oldMain}:x));
      setMessage("Главная фотография изменена.");
    }catch(err:any){setMessage(err?.message||"Не удалось сменить главную фотографию.");}
    setBusy(false);
  }

  async function removeGalleryImage(item:ArtworkImage){
    if(!window.confirm("Удалить это фото?"))return;
    setBusy(true);setMessage("");
    try{
      const storage=await supabase.storage.from("petit-sot-artworks").remove([item.image_path]);
      if(storage.error)throw storage.error;
      const {error}=await supabase.from("petit_sot_artwork_images").delete().eq("id",item.id);
      if(error)throw error;
      const remaining=galleryImages.filter(x=>x.id!==item.id).map((x,index)=>({...x,sort_order:index}));
      for(const x of remaining){const {error:updateError}=await supabase.from("petit_sot_artwork_images").update({sort_order:x.sort_order}).eq("id",x.id);if(updateError)throw updateError;}
      setGalleryImages(remaining);setMessage("Фото удалено.");
    }catch(err:any){setMessage(err?.message||"Не удалось удалить фото.");}
    setBusy(false);
  }

  async function moveGalleryImage(index:number,direction:-1|1){
    const target=index+direction;if(target<0||target>=galleryImages.length)return;
    const next=[...galleryImages];[next[index],next[target]]=[next[target],next[index]];
    setBusy(true);setMessage("");
    try{
      for(let i=0;i<next.length;i++){const {error}=await supabase.from("petit_sot_artwork_images").update({sort_order:i}).eq("id",next[i].id);if(error)throw error;}
      setGalleryImages(next.map((x,i)=>({...x,sort_order:i})));
    }catch(err:any){setMessage(err?.message||"Не удалось изменить порядок фото.");}
    setBusy(false);
  }

  async function publish(){
    if(!form.id){setMessage("Сначала сохраните картину.");return;}
    setBusy(true);setMessage("");
    try{const {data,error}=await supabase.from("petit_sot_artworks").update({status:"available",published_at:new Date().toISOString()}).eq("id",form.id).select().single();if(error)throw error;setArtworks(prev=>prev.map(x=>x.id===form.id?data:x));setSelected(data);setMessage("Картина опубликована.");}
    catch(err:any){setMessage(err?.message||"Не удалось опубликовать.");}
    setBusy(false);
  }

  async function removeArtwork(){
    if(!form.id)return;
    if(!window.confirm("Удалить эту картину? Это действие нельзя отменить."))return;
    setBusy(true);setMessage("");
    try{
      const {data:gallery,error:galleryError}=await supabase.from("petit_sot_artwork_images").select("image_path").eq("artwork_id",form.id);
      if(galleryError)throw galleryError;
      const {data:interiorRows,error:interiorError}=await supabase.from("petit_sot_artwork_interiors").select("image_path").eq("artwork_id",form.id);
      if(interiorError)throw interiorError;
      const paths=[form.image_path,...(gallery||[]).map(x=>x.image_path),...(interiorRows||[]).map(x=>x.image_path)].filter(Boolean) as string[];
      if(paths.length){const storage=await supabase.storage.from("petit-sot-artworks").remove(paths);if(storage.error)throw storage.error;}
      const {error}=await supabase.from("petit_sot_artworks").delete().eq("id",form.id);if(error)throw error;
      setArtworks(prev=>prev.filter(x=>x.id!==form.id));setSelected(null);setImage(null);setImagePreview("");setGalleryImages([]);setNewImages([]);setMessage("Картина удалена.");
    }catch(err:any){setMessage(err?.message||"Не удалось удалить картину.");}
    setBusy(false);
  }

  async function compressImage(source:Blob){
    const max=1800;const canvas=document.createElement("canvas");const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Не удалось подготовить изображение.");
    try{const bitmap=await createImageBitmap(source);const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL("image/jpeg",0.82);}
    catch{const url=URL.createObjectURL(source);try{const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error("Не удалось декодировать исходное изображение. Попробуйте JPEG или PNG."));img.src=url;});const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));ctx.drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL("image/jpeg",0.82);}finally{URL.revokeObjectURL(url);}}
  }

  async function generateDescription(){
    if(!image&&!form.image_path){setMessage("Сначала добавьте изображение картины.");return;}
    setAiBusy(true);setMessage("Подготавливаю изображение…");
    try{
      let dataUrl="";
      if(image){
        setMessage("Сжимаю изображение…");
        dataUrl=await compressImage(image);
      } else {
        setMessage("Загружаю изображение картины…");
        const imageResponse=await fetch(imageUrl);
        if(!imageResponse.ok)throw new Error("Не удалось прочитать загруженное изображение.");
        setMessage("Сжимаю изображение…");
        dataUrl=await compressImage(await imageResponse.blob());
      }
      setMessage("Отправляю картину в ИИ…");
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),60000);
      let res:Response;
      try{
        res=await fetch("/api/admin/generate-description",{
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({imageDataUrl:dataUrl,title:form.title,medium:form.medium,year:form.year,width_cm:form.width_cm,height_cm:form.height_cm,depth_cm:form.depth_cm}),
          signal:controller.signal,
        });
      }finally{clearTimeout(timeout);}
      const responseText=await res.text();
      let json:any={};
      try{json=JSON.parse(responseText);}catch{}
      if(!res.ok)throw new Error([json.error,json.detail,responseText.slice(0,500)].filter(Boolean).join(" ")||`Сервер вернул HTTP ${res.status}.`);
      if(!json.descriptionRu&&!json.description)throw new Error("ИИ не вернул русское описание.");
      setSelected({...form,description:json.descriptionRu||json.description,ai_description:json.descriptionEn||json.description} as Artwork);
      setMessage("Описание создано. При необходимости отредактируйте его и сохраните.");
    }catch(err:any){
      const message=err?.name==="AbortError"?"ИИ не ответил за 60 секунд.":err?.message||"Не удалось создать описание.";
      console.error("generateDescription failed:",err);
      setMessage("Ошибка: "+message);
    }finally{
      setAiBusy(false);
    }
  }

  async function passport(){
    if(!form.id){setMessage("Сначала сохраните картину.");return;}
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/admin/certificate/"+form.id,{cache:"no-store"});
      if(!res.ok){const text=await res.text();let j:any={};try{j=JSON.parse(text)}catch{};throw new Error(j.error||text||"Не удалось создать паспорт.");}
      const blob=await res.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(form.slug||"artwork")+"-passport.pdf";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage("PDF-паспорт создан.");
    }catch(err:any){setMessage(err?.message||"Не удалось создать паспорт.");}
    setBusy(false);
  }

  async function importArtworkToEtsy(artwork:Artwork){
    if(!etsy?.connected){setMessage("Сначала подключите Etsy.");return false;}
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/admin/etsy/import",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({artworkId:artwork.id})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||"Ошибка Etsy");
      if(!data.listingId)throw new Error("Сервер не подтвердил ID объявления Etsy.");
      setArtworks(prev=>prev.map(x=>x.id===artwork.id?{...x,etsy_listing_id:data.listingId,etsy_state:"draft",etsy_error:null,etsy_listing_url:data.listingUrl}:x));
      if(form.id===artwork.id)setSelected(prev=>prev?{...prev,etsy_listing_id:data.listingId,etsy_state:"draft",etsy_error:null,etsy_listing_url:data.listingUrl}:prev);
      setMessage("Etsy: картина «"+artwork.title+"» загружена как черновик.");
      return true;
    }catch(err:any){
      const reason=err?.message||"Ошибка";
      setArtworks(prev=>prev.map(x=>x.id===artwork.id?{...x,etsy_error:reason}:x));
      if(form.id===artwork.id)setSelected(prev=>prev?{...prev,etsy_error:reason}:prev);
      setMessage("Etsy: "+reason);
      return false;
    }finally{
      setBusy(false);
    }
  }

  async function importSelectedToEtsy(){
    if(!form.id){setMessage("Сначала сохраните картину.");return;}
    const artwork=artworks.find(x=>x.id===form.id)||form as Artwork;
    if(!etsy?.connected){setMessage("Сначала подключите Etsy.");return;}
    const action=artwork.etsy_listing_id&&!artwork.etsy_error
      ?"Картина уже есть в Etsy. Повторно загрузить и добавить фотографии?"
      :"Загрузить эту картину в Etsy как черновик?";
    if(!window.confirm(action))return;
    await importArtworkToEtsy(artwork);
  }

  async function importAllToEtsy(){
    if(!etsy?.connected){setMessage("Сначала подключите Etsy.");return;}
    const pending=artworks.filter(x=>!x.etsy_listing_id||x.etsy_error);
    if(!pending.length){setMessage("Все картины уже загружены в Etsy.");return;}
    if(!window.confirm("Загрузить "+pending.length+" картин в Etsy как черновики?"))return;
    setEtsyImporting(true);setBusy(true);setMessage("");
    let ok=0;let failed=0;
    const failures:string[]=[];
    for(let i=0;i<pending.length;i++){
      const artwork=pending[i];
      setEtsyProgress((i+1)+"/"+pending.length+" · "+artwork.title);
      try{
        const response=await fetch("/api/admin/etsy/import",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({artworkId:artwork.id})});
        const data=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(data.error||"Ошибка Etsy");
        if(!data.listingId)throw new Error("Сервер не подтвердил ID объявления Etsy.");
        ok++;
        setArtworks(prev=>prev.map(x=>x.id===artwork.id?{...x,etsy_listing_id:data.listingId,etsy_state:"draft",etsy_error:null,etsy_listing_url:data.listingUrl}:x));
      }catch(err:any){
        failed++;
        const reason=err?.message||"Ошибка";
        failures.push(artwork.title+": "+reason);
        setArtworks(prev=>prev.map(x=>x.id===artwork.id?{...x,etsy_error:reason}:x));
      }
    }
    setEtsyProgress("");
    setEtsyImporting(false);setBusy(false);
    setMessage("Etsy: создано "+ok+" объявлений"+(failed?" · ошибок "+failed:"")+(failures.length?": "+failures.slice(0,3).join(" | ")+(failures.length>3?" | и ещё "+(failures.length-3):""):"")+".");
  }

  async function logout(){await supabase.auth.signOut();location.href="/admin/login";}

  return <main className="admin-page">
    <header className="admin-top"><div className="admin-brand"><span className="eyebrow"><a href="/admin">PETIT.SOT</a> / АРХИВ</span><h1>Картины</h1></div><nav><a href="/admin/orders">Заказы</a>{etsy?.connected?<><span className="eyebrow">ETSY · {etsy.shop_name||"подключён"}</span><button type="button" onClick={importAllToEtsy} disabled={etsyImporting||busy}>{etsyImporting?etsyProgress:"Загрузить всё в Etsy ↗"}</button></>:<a href="/api/admin/etsy/connect">Подключить Etsy ↗</a>}<button onClick={logout}>Выйти</button></nav></header>
    <section className="admin-layout">
      <aside className="admin-list"><button className="admin-new" onClick={()=>{setSelected(null);setImage(null);setImagePreview("");setGalleryImages([]);setNewImages([]);setMessage("");}}>+ Новая картина</button>{artworks.map(w=><button key={w.id} className={"admin-list-row "+(form.id===w.id?"active":"")} onClick={()=>{setSelected(w);setImage(null);setImagePreview("");setNewImages([]);setMessage("");}}><span>{w.title||"Без названия"}</span><small>{({draft:"Черновик",available:"В продаже",sold:"Продана",archived:"Архив"} as Record<string,string>)[w.status]||w.status}{w.etsy_listing_id?" · Etsy #"+w.etsy_listing_id:""}</small>{w.etsy_error&&<small style={{color:"#b45309",whiteSpace:"normal"}}>Etsy: {w.etsy_error}</small>}</button>)}</aside>
      <section className="admin-editor"><form onSubmit={save}>
        <div className="admin-editor-head"><div><span className="eyebrow">КАРТИНА</span><h2>{form.title||"Новая работа"}</h2></div><select aria-label="Статус" value={form.status} onChange={e=>patch("status",e.target.value)}><option value="draft">Черновик</option><option value="available">В продаже</option><option value="sold">Продана</option><option value="archived">Архив</option></select></div>
        <div className="admin-image-field">{imagePreview?<img src={imagePreview} alt="" />:imageUrl?<img src={imageUrl} alt="" />:<div><span>Изображение картины</span><small>JPG / PNG / WEBP · максимум 15 МБ</small></div>}<label>{image?"Заменить изображение":"Выбрать изображение"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>chooseImage(e.target.files?.[0]||null)}/></label>{image&&<p className="admin-file-name">{image.name}</p>}</div><div className="admin-gallery-manager"><div className="admin-gallery-head"><div><span className="eyebrow">ГАЛЕРЕЯ</span><h3>Дополнительные фотографии</h3></div><label className="admin-gallery-add">+ Добавить фото<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>chooseGalleryImages(e.target.files)}/></label></div>{(galleryImages.length||newImages.length)?<div className="admin-gallery-grid">{galleryImages.map((item,index)=><div className="admin-gallery-item" key={item.id}><img src={supabase.storage.from("petit-sot-artworks").getPublicUrl(item.image_path).data.publicUrl} alt="" /><div className="admin-gallery-item-actions"><button type="button" onClick={()=>moveGalleryImage(index,-1)} disabled={busy||index===0}>←</button><span>{index+1}</span><button type="button" onClick={()=>moveGalleryImage(index,1)} disabled={busy||index===galleryImages.length-1}>→</button><button type="button" className="make-main" onClick={()=>makeGalleryImageMain(item)} disabled={busy||!form.image_path} title="Сделать главной">Главная</button><button type="button" className="delete" onClick={()=>removeGalleryImage(item)} disabled={busy}>×</button></div></div>)}{newImages.map((file,index)=><div className="admin-gallery-item pending" key={file.name+index}><img src={URL.createObjectURL(file)} alt="" /><div className="admin-gallery-item-actions"><span>Новое</span><button type="button" className="delete" onClick={()=>setNewImages(prev=>prev.filter((_,i)=>i!==index))}>×</button></div></div>)}</div>:<p className="admin-gallery-empty">Добавьте несколько фотографий — детали картины покажут их как галерею.</p>}</div>
        <div className="admin-form-grid"><label>Название<input value={form.title} onChange={e=>patch("title",e.target.value)} required/></label><label>Адрес страницы (Slug)<input value={form.slug} onChange={e=>patch("slug",e.target.value)} placeholder="например, untitled-i" required/></label><label>Год<input type="number" value={form.year??""} onChange={e=>patch("year",Number(e.target.value)||null)}/></label><label>Материал / техника<input value={form.medium??""} onChange={e=>patch("medium",e.target.value)} placeholder="например, масло на холсте"/></label><label>Ширина / см<input type="number" step="0.1" value={form.width_cm??""} onChange={e=>patch("width_cm",Number(e.target.value)||null)}/></label><label>Высота / см<input type="number" step="0.1" value={form.height_cm??""} onChange={e=>patch("height_cm",Number(e.target.value)||null)}/></label><label>Глубина / см<input type="number" step="0.1" value={form.depth_cm??""} onChange={e=>patch("depth_cm",Number(e.target.value)||null)}/></label><label>Цена / EUR<input type="number" step="0.01" min="0" value={form.price_eur===0?"":form.price_eur} onChange={e=>patch("price_eur",e.target.value===""?0:Number(e.target.value))}/></label></div>
        <div className="admin-description-head"><label>Описание (русский)<textarea value={form.description} onChange={e=>patch("description",e.target.value)} rows={8}/></label><div><button type="button" className="ai-button" onClick={generateDescription} disabled={aiBusy}>{aiBusy?"Анализирую картину…":"✦ Создать описание с ИИ"}</button><p>ИИ анализирует изображение и создаёт описание на русском и английском. Фактические данные не выдумываются.</p></div></div>
        {message&&<p className="admin-message">{message}</p>}
        <div className="admin-actions"><button type="button" onClick={publish} disabled={busy||!form.id}>Опубликовать ↗</button>{etsy?.connected&&form.id&&<button type="button" className="secondary" onClick={importSelectedToEtsy} disabled={busy||etsyImporting}>{form.etsy_listing_id&&!form.etsy_error?"Повторно загрузить в Etsy ↗":"Загрузить в Etsy ↗"}</button>}<button type="submit" disabled={busy}>{busy?"Сохраняю…":"Сохранить картину"} <span>↗</span></button>{form.id&&<><button type="button" className="secondary" onClick={passport} disabled={busy}>Создать паспорт PDF</button><button type="button" className="secondary" onClick={removeArtwork} disabled={busy}>Удалить картину</button></>}</div>
      </form></section>
    </section>
  </main>
}

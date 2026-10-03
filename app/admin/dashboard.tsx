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
  const [busy,setBusy]=useState(false);
  const [aiBusy,setAiBusy]=useState(false);
  const [message,setMessage]=useState("");

  const form=selected ?? {id:"",slug:"",title:"",year:new Date().getFullYear(),medium:"",width_cm:null,height_cm:null,depth_cm:null,description:"",ai_description:"",price_eur:0,status:"draft",image_path:null,certificate_number:null,created_at:""};
  const imageUrl=useMemo(()=>form.image_path?supabase.storage.from("petit-sot-artworks").getPublicUrl(form.image_path).data.publicUrl:"",[form.image_path,supabase]);

  function patch(key:string,value:any){setSelected({...form,[key]:value} as Artwork);}

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
      setSelected(result.data); setImage(null); setMessage("Saved.");
    }catch(err:any){setMessage(err?.message||"Could not save.");}
    setBusy(false);
  }

  async function generateDescription(){
    if(!image && !form.image_path){setMessage("Add an artwork image first.");return;}
    setAiBusy(true);setMessage("");
    try{
      let dataUrl="";
      if(image){
        dataUrl=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(image);});
      }else{
        const res=await fetch(imageUrl); const blob=await res.blob();
        dataUrl=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(blob);});
      }
      const res=await fetch("/api/admin/generate-description",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({imageDataUrl:dataUrl,title:form.title,medium:form.medium,year:form.year,width_cm:form.width_cm,height_cm:form.height_cm,depth_cm:form.depth_cm})});
      const json=await res.json(); if(!res.ok) throw new Error(json.error||"AI generation failed.");
      patch("description",json.description); patch("ai_description",json.description); setMessage("AI description generated — edit it if you want.");
    }catch(err:any){setMessage(err?.message||"AI generation failed.");}
    setAiBusy(false);
  }

  async function passport(){
    if(!form.id){setMessage("Save the artwork first.");return;}
    const res=await fetch("/api/admin/certificate/"+form.id);
    if(!res.ok){const j=await res.json().catch(()=>({}));setMessage(j.error||"Could not generate passport.");return;}
    const blob=await res.blob(); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=(form.slug||"artwork")+"-passport.pdf"; a.click(); URL.revokeObjectURL(url);
  }

  async function logout(){await supabase.auth.signOut();location.href="/admin/login";}

  return <main className="admin-page">
    <header className="admin-top"><div><span className="eyebrow">PETIT.SOT / PRIVATE ARCHIVE</span><h1>Works</h1></div><nav><a href="/admin/orders">Orders</a><button onClick={logout}>Sign out</button></nav></header>
    <section className="admin-layout">
      <aside className="admin-list">
        <button className="admin-new" onClick={()=>{setSelected(null);setImage(null);setMessage("");}}>+ New artwork</button>
        {artworks.map(w=><button key={w.id} className={"admin-list-row "+(form.id===w.id?"active":"")} onClick={()=>{setSelected(w);setImage(null);setMessage("");}}><span>{w.title||"Untitled"}</span><small>{w.status}</small></button>)}
      </aside>
      <section className="admin-editor">
        <form onSubmit={save}>
          <div className="admin-editor-head"><div><span className="eyebrow">ARTWORK</span><h2>{form.title||"New work"}</h2></div><select value={form.status} onChange={e=>patch("status",e.target.value)}><option value="draft">Draft</option><option value="available">Available</option><option value="sold">Sold</option><option value="archived">Archived</option></select></div>
          <div className="admin-image-field">
            {image ? <img src={URL.createObjectURL(image)} alt="" /> : imageUrl ? <img src={imageUrl} alt="" /> : <div><span>Artwork image</span><small>JPG / PNG / WEBP · max 15 MB</small></div>}
            <label>Choose image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setImage(e.target.files?.[0]||null)}/></label>
          </div>
          <div className="admin-form-grid">
            <label>Title<input value={form.title} onChange={e=>patch("title",e.target.value)} required/></label>
            <label>Slug<input value={form.slug} onChange={e=>patch("slug",e.target.value)} placeholder="e.g. untitled-i" required/></label>
            <label>Year<input type="number" value={form.year??""} onChange={e=>patch("year",Number(e.target.value)||null)}/></label>
            <label>Medium<input value={form.medium??""} onChange={e=>patch("medium",e.target.value)}/></label>
            <label>Width / cm<input type="number" step="0.1" value={form.width_cm??""} onChange={e=>patch("width_cm",Number(e.target.value)||null)}/></label>
            <label>Height / cm<input type="number" step="0.1" value={form.height_cm??""} onChange={e=>patch("height_cm",Number(e.target.value)||null)}/></label>
            <label>Depth / cm<input type="number" step="0.1" value={form.depth_cm??""} onChange={e=>patch("depth_cm",Number(e.target.value)||null)}/></label>
            <label>Price / EUR<input type="number" step="0.01" min="0" value={form.price_eur} onChange={e=>patch("price_eur",Number(e.target.value)||0)}/></label>
          </div>
          <div className="admin-description-head"><label>Description<textarea value={form.description} onChange={e=>patch("description",e.target.value)} rows={8}/></label><div><button type="button" className="ai-button" onClick={generateDescription} disabled={aiBusy}>{aiBusy?"Reading artwork…":"✦ Generate with AI"}</button><p>AI uses the actual artwork image and the metadata above. It will not invent dimensions, year or medium.</p></div></div>
          {message && <p className="admin-message">{message}</p>}
          <div className="admin-actions"><button type="submit" disabled={busy}>{busy?"Saving…":"Save artwork"} <span>↗</span></button>{form.id&&<button type="button" className="secondary" onClick={passport}>Generate passport PDF</button>}</div>
        </form>
      </section>
    </section>
  </main>
}

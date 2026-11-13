"use client";

import {FormEvent,useEffect,useRef,useState} from "react";
import styles from "./commission.module.css";

type TurnstileApi={render:(container:HTMLElement,options:{sitekey:string;callback:(token:string)=>void;"expired-callback"?:()=>void;"error-callback"?:()=>void;theme?:"light"|"dark"|"auto"})=>string;remove:(id:string)=>void;reset:(id:string)=>void};
declare global{interface Window{turnstile?:TurnstileApi}}
const SITE_KEY=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||"";
type Result={commission:{id:string;reference_code:string;estimated_price_eur:number;estimated_days_min:number;estimated_days_max:number};imageUrl:string;depositEstimate:number};

export default function CommissionBuilder({ru}:{ru:boolean}){
 const [name,setName]=useState("");const [email,setEmail]=useState("");const [country,setCountry]=useState("");
 const [description,setDescription]=useState("");const [agree,setAgree]=useState(false);const [width,setWidth]=useState("50");const [height,setHeight]=useState("70");
 const [complexity,setComplexity]=useState("medium");const [style,setStyle]=useState("Atmospheric landscape");const [palette,setPalette]=useState("");
 const [website,setWebsite]=useState("");const [token,setToken]=useState("");const [captchaError,setCaptchaError]=useState(false);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [result,setResult]=useState<Result|null>(null);
 const captchaRef=useRef<HTMLDivElement>(null);const widgetRef=useRef<string|null>(null);
 useEffect(()=>{
  if(!SITE_KEY||!captchaRef.current)return;let widget:string|undefined;let cancelled=false;
  const render=()=>{if(cancelled||!captchaRef.current||!window.turnstile||widget)return;widget=window.turnstile.render(captchaRef.current,{sitekey:SITE_KEY,theme:"light",callback:t=>{setToken(t);setCaptchaError(false);},"expired-callback":()=>setToken(""),"error-callback":()=>{setToken("");setCaptchaError(true);}});widgetRef.current=widget;};
  if(window.turnstile)render();else{let script=document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');if(!script){script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.async=true;script.defer=true;script.dataset.turnstileScript="true";document.head.appendChild(script);}script.addEventListener("load",render);}
  return()=>{cancelled=true;if(widget&&window.turnstile)window.turnstile.remove(widget);widgetRef.current=null;};
 },[]);
 const area=Number(width)*Number(height);const multiplier=complexity==="simple"?1:complexity==="detailed"?1.5:1.25;
 const estimate=Math.ceil(Math.max(180,area*.1*multiplier)/10)*10;
 const minDays=Math.round(28+(area/1000)*3+(complexity==="simple"?0:complexity==="detailed"?14:7));
 async function submit(e:FormEvent){
  e.preventDefault();if(busy)return;setError("");
  if(SITE_KEY&&!token){setCaptchaError(true);return;}
  setBusy(true);
  try{
   const response=await fetch("/api/commissions/quote",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,country,description,width:Number(width),height:Number(height),complexity,style,palette,website,turnstileToken:token})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not create the preview.");
   if(data.hidden){setError(ru?"Не удалось отправить заявку.":"Could not submit the request.");return;}
   setResult(data as Result);window.scrollTo({top:0,behavior:"smooth"});
  }catch(err){setError(err instanceof Error?err.message:(ru?"Не удалось отправить заявку.":"Could not submit the request."));}
  finally{setBusy(false);}
 }
 const reset=()=>{setResult(null);setDescription("");setToken("");if(widgetRef.current&&window.turnstile)window.turnstile.reset(widgetRef.current);};
 return <main className={styles.page}>
  <section className={styles.hero}><p className={styles.eyebrow}>PETIT.SOT STUDIO / {ru?"ИНДИВИДУАЛЬНЫЙ ЗАКАЗ":"ART COMMISSIONS"}</p><h1>{ru?<>Картина,<br/><em>созданная для вас.</em></>:<>A painting<br/><em>made for you.</em></>}</h1><p className={styles.lead}>{ru?"Расскажите Ольге о своей идее. Мы создадим визуальную концепцию, рассчитаем предварительную стоимость и сроки — до начала работы.":"Tell Olga what you have in mind. We’ll create a visual concept and calculate an estimated price and timeline before the painting begins."}</p></section>
  {result?<section className={styles.result}>
    <p className={styles.eyebrow}>{ru?"ЗАЯВКА ПРИНЯТА":"REQUEST RECEIVED"}</p><h2>{ru?"Ваша идея получила форму.":"Your idea has taken shape."}</h2>
    <img className={styles.preview} src={result.imageUrl} alt={ru?"Сгенерированный визуальный референс картины":"AI-generated painting concept"}/>
    <div className={styles.summary}><div><span>{ru?"Номер заявки":"REFERENCE"}</span><strong>{result.commission.reference_code}</strong></div><div><span>{ru?"Предварительная стоимость":"ESTIMATED PRICE"}</span><strong>€{Number(result.commission.estimated_price_eur).toLocaleString("en-IE")}</strong></div><div><span>{ru?"Предполагаемый срок":"ESTIMATED TIMELINE"}</span><strong>{result.commission.estimated_days_min}–{result.commission.estimated_days_max} {ru?"дней":"days"}</strong></div><div><span>{ru?"Предоплата после подтверждения":"50% DEPOSIT AFTER APPROVAL"}</span><strong>€{Number(result.depositEstimate).toLocaleString("en-IE")}</strong></div></div>
    <p className={styles.note}>{ru?"Это концептуальный референс, а не точная копия будущей картины. Ольга лично проверит заявку, подтвердит возможность исполнения, окончательную стоимость и сроки. Оплата пока не требуется.":"This is a visual concept, not a promise of an exact replica. Olga will personally review the request and confirm feasibility, final pricing and timing. No payment is due yet."}</p>
    <button className={styles.secondary} onClick={reset}>{ru?"Создать ещё одну заявку":"Create another request"}</button>
   </section>:<form className={styles.form} onSubmit={submit}>
    <div className={styles.sectionHead}><span>01</span><div><h2>{ru?"Расскажите об идее":"Tell us about your idea"}</h2><p>{ru?"Что вы хотите видеть на картине? Чем подробнее описание, тем точнее будет референс.":"What would you like the painting to show? A detailed description helps create a more useful concept."}</p></div></div>
    <label className={styles.field}><span>{ru?"Описание картины":"Painting description"} *</span><textarea value={description} onChange={e=>setDescription(e.target.value)} minLength={20} maxLength={1800} required rows={6} placeholder={ru?"Например: туманное утро в горах, небольшая деревня у подножия, мягкий золотистый свет, ощущение тишины...":"For example: a misty morning in the mountains, a small village at the foot of the hills, soft golden light and a quiet atmosphere..."}/></label>
    <div className={styles.grid}>
     <label className={styles.field}><span>{ru?"Художественное направление":"Art direction"}</span><select value={style} onChange={e=>setStyle(e.target.value)}><option value="Atmospheric landscape">{ru?"Атмосферный пейзаж":"Atmospheric landscape"}</option><option value="Seascape">{ru?"Морской пейзаж":"Seascape"}</option><option value="Village or city scene">{ru?"Деревня или город":"Village or city scene"}</option><option value="Still life and flowers">{ru?"Натюрморт и цветы":"Still life / flowers"}</option><option value="Expressive abstract composition">{ru?"Абстрактная композиция":"Expressive abstract"}</option><option value="Other, based on the description">{ru?"Другое, по описанию":"Other"}</option></select></label>
     <label className={styles.field}><span>{ru?"Палитра и цвета":"Preferred colours"}</span><input value={palette} onChange={e=>setPalette(e.target.value)} maxLength={180} placeholder={ru?"Тёплые землистые, приглушённые зелёные...":"Warm earth tones, muted greens..."}/></label>
    </div>
    <div className={styles.sectionHead}><span>02</span><div><h2>{ru?"Размер и сложность":"Size and complexity"}</h2><p>{ru?"Размер холста в сантиметрах. Доступны индивидуальные пропорции.":"Canvas dimensions in centimetres. Custom proportions are welcome."}</p></div></div>
    <div className={styles.grid}>
     <label className={styles.field}><span>{ru?"Ширина, см":"Width, cm"} *</span><input type="number" min="20" max="200" step="1" value={width} onChange={e=>setWidth(e.target.value)} required/></label>
     <label className={styles.field}><span>{ru?"Высота, см":"Height, cm"} *</span><input type="number" min="20" max="200" step="1" value={height} onChange={e=>setHeight(e.target.value)} required/></label>
    </div>
    <div className={styles.sizes}><button type="button" onClick={()=>{setWidth("40");setHeight("50")}}>40 × 50</button><button type="button" onClick={()=>{setWidth("50");setHeight("70")}}>50 × 70</button><button type="button" onClick={()=>{setWidth("60");setHeight("80")}}>60 × 80</button><button type="button" onClick={()=>{setWidth("100");setHeight("120")}}>100 × 120</button></div>
    <label className={styles.field}><span>{ru?"Сложность композиции":"Composition complexity"}</span><select value={complexity} onChange={e=>setComplexity(e.target.value)}><option value="simple">{ru?"Минималистичная":"Simple / minimal"}</option><option value="medium">{ru?"Средняя":"Moderate"}</option><option value="detailed">{ru?"Детализированная":"Highly detailed"}</option></select></label>
    <div className={styles.sectionHead}><span>03</span><div><h2>{ru?"Ваши контакты":"Your details"}</h2><p>{ru?"Мы свяжемся с вами после проверки концепции.":"We’ll contact you after reviewing the concept."}</p></div></div>
    <div className={styles.grid}>
     <label className={styles.field}><span>{ru?"Имя":"Name"} *</span><input value={name} onChange={e=>setName(e.target.value)} required maxLength={80} autoComplete="name"/></label>
     <label className={styles.field}><span>Email *</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254} autoComplete="email"/></label>
    </div>
    <label className={styles.field}><span>{ru?"Страна (необязательно)":"Country (optional)"}</span><input value={country} onChange={e=>setCountry(e.target.value)} maxLength={80} autoComplete="country-name"/></label>
    <input className={styles.honeypot} tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)} aria-hidden="true"/>
    {SITE_KEY&&<div className={styles.captcha}><div ref={captchaRef}/>{captchaError&&<p>{ru?"Пройдите проверку безопасности.":"Please complete the security check."}</p>}</div>}
    <div className={styles.estimate}><div><span>{ru?"Предварительная оценка":"ESTIMATED PRICE"}</span><strong>€{Number.isFinite(estimate)?estimate.toLocaleString("en-IE"):"—"}</strong></div><div><span>{ru?"Срок изготовления и первичной просушки":"ESTIMATED PRODUCTION & INITIAL DRYING"}</span><strong>{minDays}–{minDays+7} {ru?"дней":"days"}</strong></div><p>{ru?"Расчёт предварительный и будет уточнён Ольгой после просмотра заявки. Срок включает создание и первичную просушку масляной живописи; фактическое время зависит от толщины красочного слоя. Доставка и рама рассчитываются отдельно.":"This is an indicative estimate, subject to Olga’s review. Timing includes painting and initial drying; actual drying depends on paint thickness and conditions. Shipping and optional framing are quoted separately."}</p></div>
    {error&&<p className={styles.error}>{error}</p>}
    <button className={styles.submit} type="submit" disabled={busy||!agree||(Boolean(SITE_KEY)&&!token)}>{busy?(ru?"Создаём референс…":"Generating your concept…"):(ru?"Создать референс и отправить заявку":"Generate concept & submit request")} <span>↗</span></button>
    <label className={styles.consent}><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} required/><span>{ru?<>Я ознакомился с <a href="/commission-terms" target="_blank">условиями заказа картины</a> и понимаю, что AI-референс является предварительной концепцией.</>:<>I have read the <a href="/commission-terms" target="_blank">commission terms</a> and understand that the AI preview is a preliminary concept.</>}</span></label><p className={styles.terms}>{ru?"Отправляя заявку, вы соглашаетесь, что это предварительный запрос, а не подтверждённый заказ. Предоплата 50% потребуется только после согласования Ольгой.":"Submitting this request does not create a confirmed order. A 50% deposit is requested only after Olga approves the concept and final quote."}</p>
   </form>}
 </main>;
}

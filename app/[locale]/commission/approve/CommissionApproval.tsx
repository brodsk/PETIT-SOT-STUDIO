"use client";
import {useEffect,useState} from "react";
import styles from "../commission.module.css";
type Proposal={reference_code:string;width_cm:number;height_cm:number;description:string;artist_notes:string|null;final_price_eur:number;deposit_amount_eur:number;balance_amount_eur:number;estimated_days_min:number;estimated_days_max:number};
export default function CommissionApproval({reference,token,ru,sk=false}:{reference:string;token:string;ru:boolean;sk?:boolean}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[done,setDone]=useState(false),[proposal,setProposal]=useState<Proposal|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;(async()=>{try{const q=new URLSearchParams({reference,token}),r=await fetch("/api/commissions/proposal/decision?"+q.toString(),{cache:"no-store"}),d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load proposal.");if(active)setProposal(d.proposal);}catch(e){if(active)setMessage(e instanceof Error?e.message:"Could not load proposal.");}finally{if(active)setLoading(false);}})();return()=>{active=false;};},[reference,token]);
 async function decide(decision:"approve"|"decline"){if(busy)return;setBusy(true);setMessage("");try{const r=await fetch("/api/commissions/proposal/decision",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference,token,decision})}),d=await r.json();if(!r.ok)throw new Error(d.error||"Could not save your decision.");setDone(true);setMessage(decision==="approve"?(ru?"Спасибо! Подтверждение получено. Теперь можно перейти к оплате предоплаты 50%.":sk?"Ďakujeme. Objednávka bola potvrdená. Teraz môžete uhradiť 50 % zálohu.":"Thank you. Your approval is confirmed. You can now proceed to pay the 50% deposit."):(ru?"Ваш ответ сохранён. Оплата не требуется.":sk?"Vaše rozhodnutie bolo uložené. Teraz nie je potrebná žiadna platba.":"Your decision has been recorded. No payment is due."));}catch(e){setMessage(e instanceof Error?e.message:"Could not save your decision.");}finally{setBusy(false);}}
 const money=(v:number)=>"€"+Number(v||0).toFixed(2);
 return <main className={styles.page}><section className={styles.hero}><p className={styles.eyebrow}>PETIT.SOT STUDIO / {ru?"СОГЛАСОВАНИЕ ЗАКАЗА":sk?"POTVRDENIE OBJEDNÁVKY":"COMMISSION APPROVAL"}</p><h1><em>{ru?<>Проверьте<br/>предложение по картине.</>:sk?<>Skontrolujte<br/>ponuku na obraz.</>:<>Review your<br/>painting proposal.</>}</em></h1><p className={styles.lead}>{ru?"Ознакомьтесь с окончательными условиями и заметкой художника перед подтверждением.":sk?"Pred potvrdením si prečítajte konečné podmienky a poznámku výtvarníčky.":"Review the final terms and the artist’s note before approving."}</p></section><section className={styles.result}><p className={styles.note}>{ru?"Номер заказа:":sk?"Číslo objednávky:":"Commission reference:"} <strong>{reference||"—"}</strong></p>
 {loading?<p className={styles.note}>{ru?"Загружаем предложение…":sk?"Načítava sa ponuka…":"Loading proposal…"}</p>:proposal?<>
 <div className={styles.summary}>
  <div><span>{ru?"Размер холста":sk?"Rozmer plátna":"Canvas size"}</span><strong>{proposal.width_cm} × {proposal.height_cm} cm</strong></div>
  <div><span>{ru?"Описание картины":sk?"Opis obrazu":"Painting description"}</span><strong>{proposal.description}</strong></div>
  <div><span>{ru?"Полная стоимость":sk?"Celková dohodnutá cena":"Total agreed price"}</span><strong>{money(proposal.final_price_eur)}</strong></div>
  <div><span>{ru?"Предоплата 50% сейчас":sk?"Záloha 50 % teraz":"50% deposit due now"}</span><strong>{money(proposal.deposit_amount_eur)}</strong></div>
  <div><span>{ru?"Остаток перед отправкой":sk?"Zvyšná suma pred odoslaním":"Remaining balance before dispatch"}</span><strong>{money(proposal.balance_amount_eur)}</strong></div>
  <div><span>{ru?"Ориентировочный срок":sk?"Predpokladaný termín":"Estimated timeline"}</span><strong>{proposal.estimated_days_min}–{proposal.estimated_days_max} {ru?"дней":sk?"dní":"days"}</strong></div>
 </div>
 {proposal.artist_notes?.trim()&&<div style={{margin:"24px 0",padding:"20px 22px",background:"#f1eee8",borderLeft:"3px solid #8c8172"}}>
  <p className={styles.eyebrow} style={{marginTop:0}}>{ru?"ЗАМЕТКА ХУДОЖНИКА":sk?"POZNÁMKA VÝTVARNÍČKY":"A NOTE FROM THE ARTIST"}</p>
  <p className={styles.note} style={{whiteSpace:"pre-wrap",marginBottom:0}}>{proposal.artist_notes}</p>
 </div>}
 </>:null}
 {done?<h2>{ru?"Ваш ответ сохранён.":sk?"Vaše rozhodnutie bolo uložené.":"Your response has been recorded."}</h2>:!loading&&proposal&&<><h2>{ru?"Вы подтверждаете предложение?":sk?"Súhlasíte s touto ponukou?":"Do you approve the proposal?"}</h2><p className={styles.note}>{ru?"Подтверждая, вы соглашаетесь с описанием картины, стоимостью и сроками. После подтверждения можно будет внести предоплату 50%.":sk?"Potvrdením súhlasíte s opisom obrazu, cenou a termínom. Následne môžete uhradiť 50 % zálohu.":"By approving, you confirm the painting description, price and timeline. You can pay the 50% deposit after approval."}</p><button className={styles.submit} disabled={busy} onClick={()=>decide("approve")}>{busy?(ru?"Сохраняем…":sk?"Ukladá sa…":"Saving…"):(ru?"Подтвердить предложение":sk?"Potvrdiť ponuku":"Approve proposal")}</button><button className={styles.secondary} disabled={busy} onClick={()=>decide("decline")}>{ru?"Отклонить предложение":sk?"Odmietnuť ponuku":"Decline proposal"}</button></>}
 {message&&<p className={styles.note}>{message}</p>}
 </section></main>;
}

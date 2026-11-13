import type { Metadata } from "next";
import CommissionBuilder from "./CommissionBuilder";

const SITE_URL="https://www.petitsot.com";
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale}=await params;const ru=locale==="ru";
  const title=ru?"Картина на заказ — PETIT.SOT STUDIO":"Commission a Painting — PETIT.SOT STUDIO";
  const description=ru?"Создайте концепцию своей картины вместе с Ольгой Трихлеб. Выберите размер, опишите идею и получите AI-референс, предварительную стоимость и сроки.":"Commission an original oil painting by Olga Trikhleb. Describe your idea, choose a canvas size and receive an AI concept, estimated price and production timeline.";
  const url=SITE_URL+(ru?"/ru":"")+"/commission";
  return {title,description,alternates:{canonical:url,languages:{en:SITE_URL+"/commission",ru:SITE_URL+"/ru/commission","x-default":SITE_URL+"/commission"}},openGraph:{title,description,url}};
}
export default async function CommissionPage({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;return <CommissionBuilder ru={locale==="ru"}/>;
}

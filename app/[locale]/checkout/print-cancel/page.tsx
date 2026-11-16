import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PrintCheckoutCancelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  if (!ru && !sk && locale !== "en") redirect("/");
  const gallery = locale === "en" ? "/works" : "/" + locale + "/works";
  return <main className="archive" style={{ maxWidth: 760, margin: "0 auto", padding: "8rem 1.5rem", textAlign: "center" }}>
    <p className="eyebrow">PETIT.SOT STUDIO</p>
    <h1>{ru ? "Оплата отменена." : sk ? "Platba bola zrušená." : "Checkout cancelled."}</h1>
    <p>{ru ? "Платёж не был выполнен. Вы можете вернуться в галерею и повторить попытку, когда будете готовы." : sk ? "Platba nebola dokončená. Môžete sa vrátiť do galérie a skúsiť to znova, keď budete pripravení." : "No payment was completed. You can return to the gallery and try again whenever you are ready."}</p>
    <Link className="interior-button" href={gallery}>{ru ? "Вернуться в галерею" : sk ? "Späť do galérie" : "Return to the gallery"}</Link>
  </main>;
}

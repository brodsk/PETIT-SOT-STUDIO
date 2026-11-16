import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CheckoutCancelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  if (!ru && !sk && locale !== "en") redirect("/");
  const gallery = locale === "en" ? "/works" : "/" + locale + "/works";
  return <main className="archive" style={{ maxWidth: 760, margin: "0 auto", padding: "8rem 1.5rem", textAlign: "center" }}>
    <p className="eyebrow">PETIT.SOT STUDIO</p>
    <h1>{ru ? "Оплата отменена" : sk ? "Platba bola zrušená" : "Checkout cancelled"}</h1>
    <p>{ru ? "Покупка не была завершена. Вы можете вернуться в галерею, когда будете готовы." : sk ? "Nákup nebol dokončený. Keď budete pripravení, môžete sa vrátiť do galérie." : "You haven’t completed the purchase. You can return to the gallery whenever you’re ready."}</p>
    <Link className="interior-button" href={gallery}>{ru ? "Вернуться в галерею" : sk ? "Späť do galérie" : "Return to the gallery"}</Link>
  </main>;
}

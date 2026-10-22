import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="archive" style={{ maxWidth: 760, margin: "0 auto", padding: "8rem 1.5rem", textAlign: "center" }}>
      <p className="eyebrow">PETIT.SOT STUDIO</p>
      <h1>Checkout cancelled</h1>
      <p>You haven’t completed the purchase. You can return to the gallery whenever you’re ready.</p>
      <Link className="interior-button" href="/works">Return to the gallery</Link>
    </main>
  );
}

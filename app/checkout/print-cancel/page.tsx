import Link from "next/link";

export default function PrintCheckoutCancelPage() {
  return <main className="archive" style={{ maxWidth: 760, margin: "0 auto", padding: "8rem 1.5rem", textAlign: "center" }}>
    <p className="eyebrow">PETIT.SOT STUDIO</p>
    <h1>Checkout cancelled.</h1>
    <p>No payment was completed. You can return to the gallery and try again whenever you are ready.</p>
    <Link className="interior-button" href="/works">Return to the gallery</Link>
  </main>;
}

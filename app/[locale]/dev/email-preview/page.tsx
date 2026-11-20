import { notFound } from "next/navigation";
import { renderBuyerOrderEmail, renderOwnerOrderEmail, type OrderEmailData } from "../../../../lib/email/order-templates";

export const dynamic = "force-dynamic";

export default function EmailPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const sample: OrderEmailData = {
    orderNumber: "PS-TEST2026",
    createdAt: "2026-11-20T12:00:00.000Z",
    buyerName: "Alex Example",
    buyerEmail: "buyer@example.test",
    buyerLocale: "en",
    artworkTitle: "Meadow",
    artworkSlug: "meadow",
    artworkUrl: "https://www.petitsot.com/works/meadow",
    imageUrl: "https://www.petitsot.com/favicon.png",
    medium: "Oil on canvas",
    size: "40 × 50 cm",
    year: "2025",
    amount: "480.00",
    currency: "EUR",
    shippingAddress: "Alex Example, 10 Example Street, 811 01 Bratislava, Slovakia",
    paypalTransactionId: "TEST-CAPTURE-123456",
  };
  const locales = ["en", "ru", "sk"] as const;
  const owner = renderOwnerOrderEmail(sample);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px", color: "#171717", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 500 }}>Transactional email preview</h1>
      <p>Development only. Test data; no email is sent.</p>
      {locales.map((locale) => {
        const rendered = renderBuyerOrderEmail({ ...sample, buyerLocale: locale }, locale);
        return (
          <section key={locale} style={{ margin: "36px 0", borderTop: "1px solid #ddd", paddingTop: 20 }}>
            <h2>Buyer confirmation — {locale.toUpperCase()}</h2>
            <p><strong>Subject:</strong> {rendered.subject}</p>
            <iframe title={`Buyer email ${locale}`} srcDoc={rendered.html} sandbox="" style={{ width: "100%", height: 850, border: "1px solid #ddd", background: "#fff" }} />
            <details><summary>Plain text</summary><pre style={{ whiteSpace: "pre-wrap" }}>{rendered.text}</pre></details>
          </section>
        );
      })}
      <section style={{ margin: "36px 0", borderTop: "1px solid #ddd", paddingTop: 20 }}>
        <h2>Owner notification — RU</h2>
        <p><strong>Subject:</strong> {owner.subject}</p>
        <iframe title="Owner notification email" srcDoc={owner.html} sandbox="" style={{ width: "100%", height: 850, border: "1px solid #ddd", background: "#fff" }} />
        <details><summary>Plain text</summary><pre style={{ whiteSpace: "pre-wrap" }}>{owner.text}</pre></details>
      </section>
    </main>
  );
}

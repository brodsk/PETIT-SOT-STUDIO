import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for PETITSOT Studio and its Pinterest publishing integration.",
  alternates: { canonical: "https://www.petitsot.com/privacy-policy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-neutral-900">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">PETITSOT STUDIO</p>
      <h1 className="mb-4 text-4xl tracking-tight">Privacy Policy</h1>
      <p className="mb-10 text-sm text-neutral-500">Last updated: 17 October 2026</p>

      <div className="space-y-8 leading-7">
        <section>
          <h2 className="mb-2 text-xl">1. About this policy</h2>
          <p>This policy explains how PETITSOT Studio, the portfolio and online art business associated with artist Olga Trikhleb (“we”, “us”), handles information when you visit petitsot.com or connect a Pinterest account to our Pinterest publishing integration.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">2. Information we process</h2>
          <p>If an administrator connects Pinterest, the integration may process Pinterest account identifiers and profile details made available by Pinterest, access and refresh tokens, board identifiers and names, and identifiers or URLs of pins created by the integration. To prepare a pin, it also uses artwork information published on our website, such as a title, description, image and link to the artwork page.</p>
          <p className="mt-2">We do not ask for or collect your Pinterest password. Authentication takes place on Pinterest.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">3. How we use information</h2>
          <p>We use this information only to connect the authorized PETITSOT Pinterest account, select our own board, publish artwork pins, refresh authorization where permitted, and record publication status to prevent duplicate pins and troubleshoot errors.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">4. Storage and sharing</h2>
          <p>Integration records and authorization tokens are stored in our application database and are accessible to authorized administrators. We do not sell personal information or use Pinterest account data for advertising profiles. Data may be processed by service providers that operate our website, database and hosting, and by Pinterest when content is published. Those providers process data under their applicable terms and privacy policies.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">5. Retention and deletion</h2>
          <p>We retain integration data for as long as it is needed to operate the publishing feature and maintain publication records. An account administrator may disconnect Pinterest where that option is available. To request deletion of stored Pinterest integration data, ask us at manager@petitsot.com. We will handle the request subject to applicable legal and security requirements.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">6. Security</h2>
          <p>We use access controls and reasonable technical measures intended to protect stored integration data. No method of online storage or transmission can be guaranteed to be completely secure.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">7. Your choices and rights</h2>
          <p>Depending on where you live, you may have rights to access, correct, delete or restrict the processing of your personal data, or to object to certain processing. Contact us using the details below to make a request. You can also revoke the integration’s access through your Pinterest account settings.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">8. Changes to this policy</h2>
          <p>We may update this policy when the website or integration changes. The latest version will be published on this page with an updated date.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">9. Contact</h2>
          <p>For privacy questions or data requests, contact PETITSOT Studio at <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>.</p>
        </section>
      </div>
    </main>
  );
}

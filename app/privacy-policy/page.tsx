import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PETITSOT Studio handles personal data when you visit the website or contact the artist.",
  alternates: { canonical: "https://www.petitsot.com/privacy-policy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-neutral-900">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">PETITSOT STUDIO</p>
      <h1 className="mb-4 text-4xl tracking-tight">Privacy Policy</h1>
      <p className="mb-10 text-sm text-neutral-500">Last updated: 19 October 2026</p>

      <div className="space-y-8 leading-7">
        <section>
          <h2 className="mb-2 text-xl">1. Who is responsible?</h2>
          <p>
            The data controller for petitsot.com is Serhii Kapuza, operating the PETITSOT Studio project
            presenting artist Olga Trikhleb. Contact:{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>.
            Postal address: Kuzmanyho 725/15, 911 01 Trencin, Slovakia.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">2. What data do we use and why?</h2>
          <p>
            If you contact us through the form, we process your name, email address and message to reply to
            your enquiry. The form sends the message to our configured Telegram chat or chats, so the message
            may remain there until deleted. Please do not include sensitive information unless it is necessary.
          </p>
          <p className="mt-2">
            When you browse the site, hosting and infrastructure providers may process technical information
            such as your IP address, browser details, requested pages or images, and security logs to deliver
            and protect the website. If an administrator uses the Pinterest publishing integration, it may
            process account authorisation details and publication records to publish the studio's artwork.
          </p>
          <p className="mt-2">
            We use this information to operate and secure the site, answer messages, manage requested
            licensing enquiries, and maintain the administrator's publishing tools. Depending on the purpose,
            the legal basis is our legitimate interest in running the portfolio, taking steps at your request
            before a possible agreement, or meeting a legal obligation, as applicable under the GDPR.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">3. Cookies and external services</h2>
          <p>
            The site uses a first-party <code>NEXT_LOCALE</code> cookie to remember whether you prefer English
            or Russian. It may also use functional authentication cookies for authorised administration.
            We do not intentionally use advertising cookies or analytics pixels. If you follow a link to Etsy,
            Instagram, Pinterest or another external service, that service's own privacy policy applies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">4. Who may receive the data?</h2>
          <p>
            Data is shared only as needed to run the website and its features. Service providers include
            Vercel for hosting and Supabase for database and image storage. Contact-form messages are delivered
            through Telegram. Pinterest may process information when the administrator uses its publishing
            integration. Artwork images are publicly accessible on the site, and a visitor's browser may
            request those images directly from the storage provider. Depending on provider infrastructure and
            settings, data may be processed outside the European Economic Area. We do not sell personal data.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">5. How long is data kept?</h2>
          <p>
            We keep messages for as long as reasonably needed to respond and handle follow-up, and longer only
            where necessary for legal obligations or claims. Copies delivered to Telegram may remain in chat
            history until deleted by a chat administrator and may also be subject to Telegram's own systems.
            Technical logs and publishing records are kept according to the relevant service settings for
            operation, security and troubleshooting. Published artwork images remain available while the
            portfolio needs them.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">6. Your rights</h2>
          <p>
            Subject to applicable law, you may request access to your personal data, correction, deletion or
            restriction, object to processing based on legitimate interests, and request data portability where
            the legal conditions apply. To make a request, email{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>.
            You may also lodge a complaint with the Office for Personal Data Protection of the Slovak Republic
            at{" "}
            <a className="underline underline-offset-4" href="https://dataprotection.gov.sk/" target="_blank" rel="noreferrer">dataprotection.gov.sk</a>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">7. Updates and contact</h2>
          <p>
            We may update this notice when the website or its services change. The current version and update
            date will be published on this page. For privacy questions, contact{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}

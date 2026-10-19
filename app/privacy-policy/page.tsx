import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How PETITSOT Studio handles personal data when you visit this website, contact the artist, or interact with its publishing tools.",
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
          <h2 className="mb-2 text-xl">1. Who is responsible for your data?</h2>
          <p>
            The website petitsot.com is operated by an individual using the name PETITSOT Studio to present
            the artwork of Olga Trikhleb. The operator is not currently presented here as a registered company
            or Slovak sole trader. For privacy requests, contact the operator at{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>.
          </p>
          <p className="mt-2">
            Postal contact location for privacy requests: Trencin, 911 01, Slovakia.
            PETITSOT Studio is a trading name and does not itself identify a separate legal person.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">2. What information may be processed?</h2>
          <p>Depending on how you use the website, the information may include:</p>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>
              <strong>Technical and security data:</strong> IP address, request time, pages or resources
              requested, browser/device information, and error or security logs processed by the hosting and
              infrastructure providers to deliver, maintain and protect the website.
            </li>
            <li>
              <strong>Messages you send:</strong> your email address, name if supplied, message contents, and
              information you choose to provide when asking about an artwork, image permission or another matter.
            </li>
            <li>
              <strong>Website administration and publishing integration:</strong> if an authorised administrator
              connects a Pinterest account, the integration may process account/profile identifiers made
              available by Pinterest, board details, access/refresh tokens, pin identifiers or URLs, and
              publication status. The integration is intended for publishing the studio's own artwork content.
              We do not ask for a Pinterest password.
            </li>
          </ul>
          <p className="mt-2">
            Please do not send sensitive personal information unless it is genuinely necessary for your request.
            The public portfolio does not intentionally ask visitors to create an account or submit payment details.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">3. Purposes and legal bases</h2>
          <p>We process personal data only where needed for a stated purpose, including:</p>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>
              <strong>Operating and securing the website</strong> — our legitimate interests in making the
              portfolio available, preventing abuse, diagnosing faults and protecting systems (GDPR Article
              6(1)(f)).
            </li>
            <li>
              <strong>Replying to enquiries and considering a requested licence</strong> — taking steps at your
              request before a possible agreement, where applicable (Article 6(1)(b)), and our legitimate
              interest in managing correspondence (Article 6(1)(f)).
            </li>
            <li>
              <strong>Operating the administrator's Pinterest publishing integration</strong> — our legitimate
              interest in publishing our own artwork and maintaining reliable publication records (Article
              6(1)(f)); where a different legal basis is required, processing will be limited accordingly.
            </li>
            <li>
              <strong>Meeting legal obligations or establishing and defending legal claims</strong> — where
              applicable, Article 6(1)(c) or Article 6(1)(f).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl">4. Cookies and similar technologies</h2>
          <p>
            The site uses a first-party cookie named <code>NEXT_LOCALE</code> to remember the language
            preference (English or Russian) and help serve the corresponding language version. It is set for
            the site path and has a maximum lifetime of one year. This cookie is used for language preference,
            not for advertising or analytics.
          </p>
          <p className="mt-2">
            We do not intentionally use analytics cookies, advertising cookies or advertising pixels. Other
            strictly necessary technical storage may be used if required for essential operation or security.
            The actual technologies used can change as the site and its providers change. External services
            such as Instagram, Pinterest or Etsy operate under their own privacy and cookie policies when you
            follow a link or interact with content hosted by them. We cannot control their processing from
            this website. If non-essential cookies or tracking technologies are introduced, the site must be
            updated and any consent required by applicable law must be obtained before they are activated.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">5. Service providers and recipients</h2>
          <p>
            To operate the website and its features, data may be processed by infrastructure providers used
            by the project, including Vercel for hosting/deployment and Supabase for database or file-storage
            functions, and by Pinterest when the administrator-authorised publishing integration is used.
            Email providers may process messages sent to our contact address. The exact provider role and
            processing location depend on the service and its configuration.
          </p>
          <p className="mt-2">
            We do not sell personal data. We disclose data only as reasonably necessary to operate the site,
            respond to a request, comply with law, protect rights or address security incidents. Providers may
            act as processors or independent controllers depending on the service and activity.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">6. International transfers</h2>
          <p>
            Some service providers may process information outside the European Economic Area. Where personal
            data is transferred internationally, the relevant provider and transfer mechanism must be assessed
            for the service in use; where required, appropriate safeguards under Chapter V GDPR must apply.
            Consult the providers' current privacy and data-transfer documentation for further details.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">7. How long data is kept</h2>
          <p>
            We keep enquiry correspondence for as long as reasonably necessary to handle the request and any
            follow-up, and longer only where needed to document an agreement, meet a legal obligation or
            establish or defend legal claims. Website and security logs are retained according to the hosting
            provider's configuration and only for as long as reasonably needed for security and troubleshooting.
            Pinterest integration records are retained while needed to operate the integration, maintain
            publication status or address security and legal needs; authorisation can be revoked through
            Pinterest and deletion may be requested from us.
          </p>
          <p className="mt-2">
            Retention periods should be reviewed against the actual hosting, database, backup and integration
            settings; we do not promise a fixed period where the configuration has not been verified.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">8. Your data protection rights</h2>
          <p>
            Subject to the conditions and exceptions in applicable law, you may request access to your personal
            data, rectification, erasure, restriction of processing, or object to processing based on legitimate
            interests. You may also have a right to data portability where the legal conditions are met. If
            processing is based on consent, you may withdraw it at any time; withdrawal does not affect the
            lawfulness of processing before withdrawal.
          </p>
          <p className="mt-2">
            To exercise a right, email{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>.
            We may need to verify your identity before acting. You also have the right to lodge a complaint
            with a competent data protection supervisory authority, including the Office for Personal Data
            Protection of the Slovak Republic. You may contact the Slovak authority via{" "}
            <a className="underline underline-offset-4" href="https://dataprotection.gov.sk/" target="_blank" rel="noreferrer">dataprotection.gov.sk</a>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">9. Children</h2>
          <p>
            This portfolio is not designed to collect personal data from children. If you believe a child has
            provided personal data unnecessarily, contact us and we will review the request.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">10. Links to other websites</h2>
          <p>
            This website may link to third-party platforms, including Etsy, Instagram and Pinterest. When you
            leave petitsot.com, the other platform's terms, privacy notice and cookie practices apply. Review
            those notices before providing information or completing a purchase.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">11. Changes to this policy</h2>
          <p>
            This notice may be updated if the website, its providers or applicable requirements change. The
            current version and its update date will be published on this page.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">12. Contact</h2>
          <p>
            Privacy enquiries and data requests:{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import ContactForm from "./ContactForm";

const SITE_URL = "https://petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru ? "Контакты — Ольга Трихлеб" : "Contact — Olga Trikhleb";
  const description = ru
    ? "Связаться с Ольгой Трихлеб по вопросам о картинах, покупке работ и сотрудничестве."
    : "Contact Olga Trikhleb about artworks, purchases and collaborations.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/contact`,
      languages: {
        en: `${SITE_URL}/en/contact`,
        ru: `${SITE_URL}/ru/contact`,
        "x-default": `${SITE_URL}/en/contact`,
      },
    },
    openGraph: { title, description, url: `${SITE_URL}/${locale}/contact` },
  };
}

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";

  return (
    <main className="contact-page contact-form-page contact-page-restored">
      <div className="contact-inner contact-inner-restored">
        <span className="contact-eyebrow contact-eyebrow-restored">
          {ru ? "СВЯЗАТЬСЯ" : "GET IN TOUCH"}
        </span>

        <h1 className="contact-title-restored">
          {ru ? <>Давайте поговорим<br /><em>об искусстве.</em></> : <>Let’s talk<br /><em>about art.</em></>}
        </h1>

        <p className="contact-intro-restored">
          {ru
            ? "По вопросам о картинах, покупке или сотрудничестве оставьте сообщение."
            : "For artwork enquiries, purchases or collaborations, leave us a message."}
        </p>

        <ContactForm ru={ru} />
      </div>

      <style jsx>{`
        .contact-page-restored {
          min-height: calc(100vh - 82px);
          padding: 72px 5vw 120px;
          display: flex;
          align-items: flex-start;
        }

        .contact-inner-restored {
          width: 100%;
          max-width: 1040px;
          margin: 0 auto;
        }

        .contact-eyebrow-restored {
          display: block;
          margin: 0 0 42px;
          font-size: 10px;
          line-height: 1;
          letter-spacing: .15em;
          text-transform: uppercase;
          opacity: .55;
        }

        .contact-title-restored {
          margin: 0 0 52px !important;
          max-width: 980px;
          font-size: clamp(64px, 10vw, 150px) !important;
          line-height: .82 !important;
          letter-spacing: -.07em !important;
          font-weight: 400 !important;
        }

        .contact-title-restored em {
          font-family: Georgia, serif;
          font-style: italic;
          font-weight: 400;
        }

        .contact-intro-restored {
          max-width: 390px;
          margin: 0 0 48px;
          font-size: 13px;
          line-height: 1.5;
        }

        :global(.contact-form) {
          width: min(620px, 100%);
          margin: 0;
          padding-top: 4px;
        }

        :global(.contact-form > label) {
          position: relative !important;
          display: block !important;
          width: 100% !important;
          min-height: 74px !important;
          height: auto !important;
          padding: 0 0 20px !important;
          margin: 0 0 24px !important;
          border-bottom: 1px solid rgba(23,23,23,.32) !important;
          box-sizing: border-box !important;
        }

        :global(.contact-form > label > span) {
          position: static !important;
          display: block !important;
          width: 100% !important;
          height: auto !important;
          margin: 0 0 10px !important;
          font-size: 9px;
          line-height: 1 !important;
          letter-spacing: .13em;
          text-transform: uppercase;
          opacity: .55;
        }

        :global(.contact-form input),
        :global(.contact-form textarea) {
          position: relative !important;
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          border: 0 !important;
          outline: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 15px;
          line-height: 1.45;
          border-radius: 0;
          resize: vertical;
        }

        :global(.contact-form input) {
          height: 28px !important;
          min-height: 28px !important;
        }

        :global(.contact-form textarea) {
          height: 130px !important;
          min-height: 130px !important;
        }

        :global(.contact-form input:focus),
        :global(.contact-form textarea:focus) {
          box-shadow: none;
        }

        :global(.contact-form > button) {
          width: 100%;
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
          padding: 0 16px;
          border: 1px solid #171717;
          background: #171717;
          color: #f7f6f2;
          font: inherit;
          font-size: 9px;
          letter-spacing: .13em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity .2s ease;
        }

        :global(.contact-form > button:hover:not(:disabled)) {
          opacity: .78;
        }

        :global(.contact-form > button:disabled) {
          cursor: default;
          opacity: .5;
        }

        :global(.contact-form > button strong) {
          font-size: 16px;
          line-height: 1;
          font-weight: 400;
        }

        :global(.contact-form-status) {
          margin: 16px 0 0;
          font-size: 10px;
          line-height: 1.5;
        }

        :global(.contact-form-status.success) {
          opacity: .65;
        }

        :global(.contact-form-status.error) {
          opacity: .8;
        }

        :global(.contact-honeypot) {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }

        @media (max-width: 700px) {
          .contact-page-restored {
            min-height: calc(100svh - 68px);
            padding: 54px 16px 86px;
          }

          .contact-inner-restored {
            max-width: none;
          }

          .contact-eyebrow-restored {
            margin-bottom: 34px;
            font-size: 8px;
          }

          .contact-title-restored {
            margin-bottom: 34px !important;
            font-size: clamp(58px, 17vw, 90px) !important;
            line-height: .84 !important;
          }

          .contact-intro-restored {
            max-width: 285px;
            margin-bottom: 42px;
            font-size: 11px;
            line-height: 1.5;
          }

          :global(.contact-form) {
            width: 100%;
          }

          :global(.contact-form > label) {
            min-height: 64px !important;
            padding-bottom: 16px !important;
            margin-bottom: 21px !important;
          }

          :global(.contact-form > label > span) {
            font-size: 8px;
            margin-bottom: 9px;
          }

          :global(.contact-form input),
          :global(.contact-form textarea) {
            font-size: 14px;
          }

          :global(.contact-form textarea) {
            height: 120px !important;
            min-height: 120px !important;
          }

          :global(.contact-form > button) {
            min-height: 50px;
          }
        }
      `}</style>
    </main>
  );
}

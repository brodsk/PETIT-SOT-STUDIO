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
    <main className="contact-page contact-form-page">
      <div className="contact-inner">
        <span className="contact-eyebrow">{ru ? "СВЯЗАТЬСЯ" : "GET IN TOUCH"}</span>
        <h1>{ru ? <>Давайте поговорим<br/><em>об искусстве.</em></> : <>Let’s talk<br/><em>about art.</em></>}</h1>
        <p>{ru ? "По вопросам о картинах, покупке или сотрудничестве оставьте сообщение." : "For artwork enquiries, purchases or collaborations, leave us a message."}</p>
        <ContactForm ru={ru}/>
      </div>
    </main>
  );
}

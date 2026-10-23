import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import styles from "./contact.module.css";

const SITE_URL = "https://www.petitsot.com";
const INSTAGRAM_URL = "https://www.instagram.com/petit.sot.art";
const ETSY_URL = "https://petitsot.etsy.com";
const SASHE_URL = "https://www.sashe.sk/petitsot";
const PINTEREST_URL = "https://pin.it/LvhmSem3U";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru ? "Контакты — Ольга Трихлеб" : "Contact — Olga Trikhleb";
  const description = ru ? "Связаться с Ольгой Трихлеб по вопросам о картинах, покупке работ и сотрудничестве." : "Contact Olga Trikhleb about artworks, purchases and collaborations.";
  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/contact`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/contact`,
        ru: `${SITE_URL}/ru/contact`,
        "x-default": `${SITE_URL}/contact`,
      },
    },
    openGraph: { title, description, url: canonical },
  };
}

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  return (
    <main className={`contact-page contact-form-page ${styles.page}`}>
      <div className={styles.inner}>
        <span className={`contact-eyebrow ${styles.eyebrow}`}>{ru ? "СВЯЗАТЬСЯ" : "GET IN TOUCH"}</span>
        <h1 className={styles.title}>{ru ? <>Давайте поговорим<br /><em>об искусстве.</em></> : <>Let’s talk<br /><em>about art.</em></>}</h1>
        <p className={styles.intro}>{ru ? "По вопросам о картинах, покупке или сотрудничестве оставьте сообщение." : "For artwork enquiries, purchases or collaborations, leave us a message."}</p>
        <ContactForm ru={ru} />
        <nav className={styles.socialLinks} aria-label={ru ? "Социальные сети и магазины" : "Social media and shops"}>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            <span>INSTAGRAM</span>
            <strong>@petit.sot.art</strong>
            <i aria-hidden="true">↗</i>
          </a>
          <a href={ETSY_URL} target="_blank" rel="noopener noreferrer">
            <span>ETSY SHOP</span>
            <strong>PETITSOT</strong>
            <i aria-hidden="true">↗</i>
          </a>
          <a href={SASHE_URL} target="_blank" rel="noopener noreferrer">
            <span>{ru ? "МАГАЗИН SAShE" : "SAShE SHOP"}</span>
            <strong>PETITSOT</strong>
            <i aria-hidden="true">↗</i>
          </a>
          <a href={PINTEREST_URL} target="_blank" rel="noopener noreferrer">
            <span>PINTEREST</span>
            <strong>PETIT.SOT</strong>
            <i aria-hidden="true">↗</i>
          </a>
        </nav>
      </div>
    </main>
  );
}

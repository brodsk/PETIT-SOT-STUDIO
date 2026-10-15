import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru ? "Об Ольге Трихлеб — PETITSOT" : "About Olga Trikhleb — PETITSOT";
  const description = ru
    ? "Ольга Трихлеб — художница, работающая с живописью, цветом и повседневными сюжетами. Оригинальные картины PETITSOT."
    : "Meet Olga Trikhleb, an artist exploring painting, colour and everyday scenes. Discover original paintings by PETITSOT.";
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: { title, description, url: `${SITE_URL}/about` },
  };
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";

  return (
    <main className="text-page about-page">
      <section className="about-hero">
        <p className="eyebrow">{ru ? "Художница / Авторская живопись" : "Artist / Original paintings"}</p>
        <h1>{ru ? <>Ольга<br /><i>Трихлеб.</i></> : <>Olga<br /><i>Trikhleb.</i></>}</h1>
        <div className="about-lead">
          <span className="about-index">PETITSOT / 01</span>
          <p>{ru
            ? "Я создаю оригинальные картины, исследуя настроение места, выразительность цвета и детали, которые обычно остаются незамеченными."
            : "I create original paintings exploring the atmosphere of a place, the character of colour, and the small details that often go unnoticed."}</p>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>01</span><span>{ru ? "Мой путь" : "The artist"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "Живопись как способ смотреть внимательнее." : "A way of looking closer."}</h2>
          <p>{ru
            ? "Художественный путь Ольги начался с обучения искусству в Северодонецке. Этот опыт заложил основу её визуального языка и интереса к тому, как настроение передаётся через композицию, цвет и фактуру."
            : "Olga’s artistic path began with formal art studies in Sievierodonetsk. That early experience shaped the foundations of her visual language and her interest in how mood can be expressed through composition, colour and texture."}</p>
          <p>{ru
            ? "Сегодня она развивает самостоятельную художественную практику, создавая работы, в которых важны не только изображённый сюжет, но и ощущение, которое он оставляет."
            : "Today, she continues to develop an independent practice, creating paintings in which the subject matters as much as the feeling it leaves behind."}</p>
        </div>
      </section>

      <section className="about-section about-section-practice">
        <div className="about-section-label"><span>02</span><span>{ru ? "Практика" : "The practice"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "Сюжеты, цвет, фактура." : "Subjects, colour, texture."}</h2>
          <p>{ru
            ? "В работах Ольги встречаются городские сцены, пейзажи и фрагменты повседневной жизни. Она обращается к знакомым местам и простым моментам, позволяя цвету и живописной поверхности задавать настроение картины."
            : "Olga’s work moves between city scenes, landscapes and fragments of everyday life. She returns to familiar places and ordinary moments, letting colour and the painted surface shape the atmosphere of each piece."}</p>
          <p>{ru
            ? "Каждая картина создаётся как самостоятельная работа. Вместо единого сюжета, который объясняет всё, здесь остаётся пространство для личного восприятия зрителя."
            : "Each painting is made as an independent work. Rather than explaining everything through one fixed narrative, the work leaves room for the viewer’s own response."}</p>
        </div>
      </section>

      <section className="about-originals">
        <p className="eyebrow">{ru ? "Оригинальные работы" : "Original works"}</p>
        <p className="about-originals-statement">{ru
          ? "Каждая работа — оригинал, созданный художницей вручную."
          : "Every work is an original painting, made by the artist."}</p>
        <div className="about-originals-bottom">
          <span>{ru ? "Живопись · Оригиналы · PETITSOT" : "Painting · Originals · PETITSOT"}</span>
          <Link className="arrow-link" href="/works">{ru ? "Смотреть работы" : "Explore the paintings"} <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const title = ru ? "Об Ольге Трихлеб — PETIT.SOT" : "About Olga Trikhleb — PETIT.SOT";
  const description = ru
    ? "Ольга Трихлеб — художница PETIT.SOT. Познакомьтесь с её художественным миром и оригинальными картинами."
    : "Meet Olga Trikhleb, the artist behind PETIT.SOT, and explore her world of original paintings.";
  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/about`;
  return {
    title, description,
    alternates: { canonical, languages: { en: `${SITE_URL}/about`, ru: `${SITE_URL}/ru/about`, "x-default": `${SITE_URL}/about` } },
    openGraph: { title, description, url: canonical, images: [{ url: "/IMG_20261025_113638_516.jpg", alt: "Olga Trikhleb, artist behind PETIT.SOT" }] },
  };
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  return (
    <main className="text-page about-page">
      <section className="about-hero">
        <p className="eyebrow">{ru ? "Художница · Авторская живопись" : "Artist · Original paintings"}</p>
        <h1>{ru ? <>Ольга<br /><i>Трихлеб.</i></> : <>Olga<br /><i>Trikhleb.</i></>}</h1>
        <div className="about-lead">
          <span className="about-index">PETIT.SOT / 01</span>
          <p>{ru
            ? "Я создаю картины, в которых важны настроение, цвет и тихая выразительность повседневных моментов. Для меня живопись — способ остановиться и внимательнее посмотреть на мир вокруг."
            : "I make paintings shaped by atmosphere, colour and the quiet poetry of everyday moments. For me, painting is a way to pause and look a little closer at the world around us."}</p>
        </div>
      </section>

      <section className="about-portrait" aria-label={ru ? "О художнице" : "Portrait of the artist"}>
        <div className="about-portrait-image">
          <Image src="/IMG_20261025_113638_516.jpg" alt={ru ? "Ольга Трихлеб на пленэре с кистью и альбомом" : "Olga Trikhleb outdoors with a paintbrush and sketchbook"} fill priority sizes="(max-width: 700px) 100vw, 58vw" />
        </div>
        <div className="about-portrait-caption">
          <span>{ru ? "Ольга Трихлеб" : "Olga Trikhleb"}</span>
          <span>{ru ? "Художница · PETIT.SOT" : "Artist · PETIT.SOT"}</span>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>01</span><span>{ru ? "Мой путь" : "The artist"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "Живопись как способ смотреть внимательнее." : "A way of looking closer."}</h2>
          <p>{ru
            ? "Мой художественный путь начался с обучения искусству в Северодонецке. Этот опыт стал основой моего визуального языка и интереса к тому, как настроение рождается из композиции, цвета и фактуры."
            : "My artistic path began with formal art studies in Sievierodonetsk. That experience helped shape my visual language and my interest in how mood emerges through composition, colour and texture."}</p>
          <p>{ru
            ? "Сегодня я продолжаю развивать собственную художественную практику. В каждой работе мне важно не только то, что изображено, но и чувство, которое картина оставляет зрителю."
            : "Today, I continue to develop my own practice. In every painting, I care not only about what is depicted, but also about the feeling the work leaves with the viewer."}</p>
        </div>
      </section>

      <section className="about-section about-section-practice">
        <div className="about-section-label"><span>02</span><span>{ru ? "Практика" : "The practice"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "Сюжеты, цвет, фактура." : "Subjects, colour, texture."}</h2>
          <p>{ru
            ? "В моих работах встречаются городские сцены, пейзажи и фрагменты повседневной жизни. Я возвращаюсь к знакомым местам и простым моментам, позволяя цвету и живописной поверхности задавать настроение картины."
            : "My work moves between city scenes, landscapes and fragments of everyday life. I return to familiar places and ordinary moments, letting colour and the painted surface shape the atmosphere of each piece."}</p>
          <p>{ru
            ? "Каждая картина создаётся как самостоятельная работа и приглашение к личному восприятию. Мне нравится, когда у зрителя остаётся пространство для собственных мыслей и чувств."
            : "Each painting is an independent work and an invitation to a personal response. I like to leave room for the viewer’s own thoughts, memories and feelings."}</p>
        </div>
      </section>

      <section className="about-originals">
        <p className="eyebrow">{ru ? "PETIT.SOT · Оригинальные работы" : "PETIT.SOT · Original works"}</p>
        <p className="about-originals-statement">{ru
          ? "Картины, созданные вручную. Работы, которые остаются с вами."
          : "Paintings made by hand. Works that stay with you."}</p>
        <div className="about-originals-bottom">
          <span>{ru ? "Живопись · Оригиналы · PETIT.SOT" : "Painting · Originals · PETIT.SOT"}</span>
          <Link className="arrow-link" href="/works">{ru ? "Смотреть работы" : "Explore the paintings"} <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const SITE_URL = "https://www.petitsot.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  const title = ru ? "Ольга Трихлеб — современная художница, авторская живопись" : sk ? "Olga Trikhleb — súčasná výtvarníčka a autorka originálnych obrazov" : "Olga Trikhleb — Contemporary Artist & Original Painter";
  const description = ru
    ? "Ольга Трихлеб — современная художница и автор оригинальной живописи PETIT.SOT STUDIO. Биография, художественная практика, пейзажи, городские сюжеты и картины, доступные для покупки онлайн."
    : sk ? "Spoznajte súčasnú výtvarníčku Olgu Trikhleb, autorku originálnych obrazov PETIT.SOT STUDIO. Objavte jej umeleckú tvorbu, krajinky, mestské motívy a originálne diela dostupné na zakúpenie. Pôsobí na Slovensku." : "Meet contemporary artist Olga Trikhleb, creator of one-of-a-kind original paintings at PETIT.SOT STUDIO. Explore her artistic practice, landscape and city paintings, and original artwork available to collect online. Based in Slovakia, open to enquiries worldwide.";
  const canonical = `${SITE_URL}${ru ? "/ru" : sk ? "/sk" : ""}/about`;
  return {
    title, description,
    alternates: { canonical, languages: { en: `${SITE_URL}/about`, ru: `${SITE_URL}/ru/about`, sk: `${SITE_URL}/sk/about`, "x-default": `${SITE_URL}/about` } },
    openGraph: { title, description, url: canonical, images: [{ url: "/IMG_20261025_113638_516.jpg", alt: "Olga Trikhleb, artist behind PETIT.SOT" }] },
  };
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ru = locale === "ru";
  const sk = locale === "sk";
  const pageUrl = `${SITE_URL}${ru ? "/ru" : ""}/about`;
  const artistSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${pageUrl}#profile`,
    url: pageUrl,
    name: ru ? "Ольга Трихлеб — художница из Тренчина" : sk ? "Olga Trikhleb — výtvarníčka z Trenčína" : "Olga Trikhleb — Artist in Trenčín",
    mainEntity: {
      "@type": "Person",
      "@id": `${SITE_URL}/#artist`,
      name: "Olga Trikhleb",
      url: `${SITE_URL}/about`,
      jobTitle: sk ? "Výtvarníčka" : "Visual artist",
      homeLocation: { "@type": "City", name: "Trenčín", containedInPlace: { "@type": "Country", name: "Slovakia" } },
      worksFor: { "@id": `${SITE_URL}/#studio` },
      sameAs: ["https://www.instagram.com/petit.sot.art"],
      knowsAbout: ["Painting", "Contemporary art", "Acrylic painting", "Landscape painting"],
    },
  };
  return (
    <main className="text-page about-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(artistSchema) }} />
      <section className="about-hero">
        <p className="eyebrow">{ru ? "Художница · Авторская живопись" : sk ? "Výtvarníčka · Originálna maľba" : "Artist · Original paintings"}</p>
        <h1>{ru ? <>Ольга<br /><i>Трихлеб.</i></> : <>Olga<br /><i>Trikhleb.</i></>}</h1>
        <div className="about-lead">
          <span className="about-index">PETIT.SOT / 01</span>
          <p>{ru
            ? "Я создаю картины, в которых важны настроение, цвет и тихая выразительность повседневных моментов. Для меня живопись — способ остановиться и внимательнее посмотреть на мир вокруг."
            : sk ? "Venujem sa maľbe, v ktorej zohrávajú dôležitú úlohu atmosféra, farby a tichá poézia každodenných okamihov. Maľovanie je pre mňa spôsob, ako sa na chvíľu zastaviť a pozrieť sa na svet okolo seba pozornejšie." : "I make paintings shaped by atmosphere, colour and the quiet poetry of everyday moments. For me, painting is a way to pause and look a little closer at the world around us."}</p>
        </div>
      </section>

      <section className="about-portrait" aria-label={ru ? "О художнице" : sk ? "Portrét výtvarníčky" : "Portrait of the artist"}>
        <div className="about-portrait-image">
          <Image src="/IMG_20261025_113638_516.jpg" alt={ru ? "Ольга Трихлеб на пленэре с кистью и альбомом" : sk ? "Olga Trikhleb v prírode so štetcom a skicárom" : "Olga Trikhleb outdoors with a paintbrush and sketchbook"} fill priority sizes="(max-width: 700px) 100vw, 58vw" />
        </div>
        <div className="about-portrait-caption">
          <span>{ru ? "Ольга Трихлеб" : "Olga Trikhleb"}</span>
          <span>{ru ? "Художница · PETIT.SOT" : sk ? "Výtvarníčka · PETIT.SOT" : "Artist · PETIT.SOT"}</span>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-label"><span>01</span><span>{ru ? "Мой путь" : sk ? "Moja cesta" : "The artist"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "Живопись как способ смотреть внимательнее." : sk ? "Maľba ako spôsob vnímať svet pozornejšie." : "A way of looking closer."}</h2>
          <p>{ru
            ? "Мой художественный путь начался с обучения искусству. Этот опыт стал основой моего визуального языка и интереса к тому, как настроение рождается из композиции, цвета и фактуры."
            : sk ? "Moja umelecká cesta sa začala štúdiom výtvarného umenia. Táto skúsenosť formovala môj vizuálny jazyk a záujem o to, ako nálada vzniká prostredníctvom kompozície, farieb a textúry." : "My artistic path began with art studies. That experience helped shape my visual language and my interest in how mood emerges through composition, colour and texture."}</p>
          <p>{ru
            ? "Сегодня я продолжаю развивать собственную художественную практику. В каждой работе мне важно не только то, что изображено, но и чувство, которое картина оставляет зрителю."
            : sk ? "Dnes ďalej rozvíjam vlastnú umeleckú tvorbu. V každom obraze mi záleží nielen na tom, čo zobrazuje, ale aj na pocite, ktorý v divákovi zanechá." : "Today, I continue to develop my own practice. In every painting, I care not only about what is depicted, but also about the feeling the work leaves with the viewer."}</p>
          <p>{ru
            ? "Я независимая художница из Тренчина, Словакия. Моя студия PETIT.SOT STUDIO представляет авторскую живопись и участвует в современной художественной жизни города."
            : sk ? "Som nezávislá výtvarníčka pôsobiaca v Trenčíne na Slovensku. Prostredníctvom PETIT.SOT STUDIO predstavujem originálne obrazy a zapájam sa do súčasného umeleckého života mesta." : "I am an independent visual artist based in Trenčín, Slovakia. Through PETIT.SOT STUDIO, I present original paintings and take part in the city’s contemporary art life."}</p>
        </div>
      </section>

      <section className="about-section about-section-education">
        <div className="about-section-label"><span>02</span><span>{ru ? "Образование" : sk ? "Vzdelanie" : "Education"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "Фундамент для творческого взгляда." : sk ? "Základy tvorivého pohľadu." : "A foundation for a creative perspective."}</h2>
          <p>{ru
            ? "Я окончила художественную школу в Северодонецке, где получила первые системные знания в искусстве и развила интерес к цвету, композиции и визуальному выражению."
            : sk ? "Študovala som na umeleckej škole v Severodonecku, kde som získala základy výtvarného umenia a rozvíjala záujem o farby, kompozíciu a vizuálne vyjadrenie." : "I studied at an art school in Sievierodonetsk, where I built my early understanding of art and developed an interest in colour, composition and visual expression."}</p>
          <p>{ru
            ? "В 2023 году я получила степень бакалавра по направлению «Архитектура и строительство» в Харьковском национальном университете городского хозяйства имени А. Н. Бекетова. Моя образовательная программа — «Архитектура и градостроительство»."
            : sk ? "V roku 2023 som získala bakalársky titul v odbore architektúra a stavebníctvo na Charkovskej národnej univerzite mestského hospodárstva O. M. Beketova. Študijný program bol zameraný na architektúru a urbanizmus." : "In 2023, I earned a Bachelor's degree in Architecture and Construction from O. M. Beketov National University of Urban Economy in Kharkiv, completing the programme in Architecture and Town Planning."}</p>
        </div>
      </section>

      <section className="about-section about-section-practice">
        <div className="about-section-label"><span>03</span><span>{ru ? "Практика" : sk ? "Tvorba" : "The practice"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "Сюжеты, цвет, фактура." : sk ? "Motívy, farby, textúra." : "Subjects, colour, texture."}</h2>
          <p>{ru
            ? "В моих работах встречаются городские сцены, пейзажи и фрагменты повседневной жизни. Я возвращаюсь к знакомым местам и простым моментам, позволяя цвету и живописной поверхности задавать настроение картины."
            : sk ? "V mojej tvorbe sa prelínajú mestské scenérie, krajiny a útržky každodenného života. Vraciam sa k známym miestam a obyčajným okamihom a nechávam farby a maliarsky povrch vytvárať atmosféru každého diela." : "My work moves between city scenes, landscapes and fragments of everyday life. I return to familiar places and ordinary moments, letting colour and the painted surface shape the atmosphere of each piece."}</p>
          <p>{ru
            ? "Каждая картина создаётся как самостоятельная работа и приглашение к личному восприятию. Мне нравится, когда у зрителя остаётся пространство для собственных мыслей и чувств."
            : sk ? "Každý obraz je samostatným dielom a pozvaním k osobnému vnímaniu. Rada nechávam divákovi priestor na vlastné myšlienky, spomienky a pocity." : "Each painting is an independent work and an invitation to a personal response. I like to leave room for the viewer’s own thoughts, memories and feelings."}</p>
        </div>
      </section>


      <section className="about-section">
        <div className="about-section-label"><span>04</span><span>{ru ? "Место" : sk ? "Ateliér" : "The studio"}</span></div>
        <div className="about-section-copy">
          <h2>{ru ? "PETIT.SOT STUDIO в Тренчине." : sk ? "Nezávislé štúdio PETIT.SOT v Trenčíne." : "An independent studio in Trenčín."}</h2>
          <p>{ru
            ? "PETIT.SOT STUDIO — независимая художественная студия художницы Ольги Трихлеб, базирующаяся в Тренчине, Словакия. Здесь развивается её авторская практика и создаются оригинальные живописные работы."
            : sk ? "PETIT.SOT STUDIO je nezávislé umelecké štúdio výtvarníčky Olgy Trikhleb so sídlom v Trenčíne na Slovensku. Je priestorom pre jej umeleckú tvorbu a originálne obrazy." : "PETIT.SOT STUDIO is an independent art studio by visual artist Olga Trikhleb, based in Trenčín, Slovakia. It is the home of her ongoing artistic practice and original paintings."}</p>
          <p>{ru
            ? "В 2026 году Тренчин носит титул Европейской культурной столицы (European Capital of Culture). Для студии это часть культурного контекста города, в котором она работает. PETIT.SOT STUDIO является независимым проектом и не заявляет об официальной аффилиации с программой Trenčín 2026."
            : sk ? "V roku 2026 je Trenčín Európskym hlavným mestom kultúry. Je to súčasť širšieho kultúrneho kontextu, v ktorom štúdio pôsobí. PETIT.SOT STUDIO je nezávislý projekt a netvrdí, že je oficiálne prepojené s programom Trenčín 2026." : "In 2026, Trenčín holds the title of European Capital of Culture. This is part of the wider cultural context in which the studio is based. PETIT.SOT STUDIO is an independent project and is not claiming official affiliation with the Trenčín 2026 programme."}</p>
          <p><a href="https://www.trencin2026.eu/en/home/" target="_blank" rel="noreferrer">{ru ? "Официальный сайт Trenčín 2026 ↗" : sk ? "Oficiálna stránka Trenčín 2026 ↗" : "Official Trenčín 2026 website ↗"}</a></p>
        </div>
      </section>
      <section className="about-originals">
        <p className="eyebrow">{ru ? "PETIT.SOT · Оригинальные работы" : sk ? "PETIT.SOT · Originálne diela" : "PETIT.SOT · Original works"}</p>
        <p className="about-originals-statement">{ru
          ? "Картины, созданные вручную. Работы, которые остаются с вами."
          : sk ? "Ručne maľované obrazy. Diela, ktoré vo vás zostanú." : "Paintings made by hand. Works that stay with you."}</p>
        <div className="about-originals-bottom">
          <span>{ru ? "Живопись · Оригиналы · PETIT.SOT" : sk ? "Maľba · Originály · PETIT.SOT" : "Painting · Originals · PETIT.SOT"}</span>
          <Link className="arrow-link" href="/works">{ru ? "Смотреть работы" : sk ? "Pozrieť obrazy" : "Explore the paintings"} <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}

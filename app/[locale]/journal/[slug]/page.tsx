import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const SITE_URL = "https://www.petitsot.com";
const PUBLISHED = "2026-11-09";

type Section = { heading: string; paragraphs: string[]; bullets?: string[] };
type LocalArticle = { title: string; description: string; intro: string; sections: Section[]; takeaway: string };
type Article = { slug: string; en: LocalArticle; ru: LocalArticle; related: { slug: string; en: string; ru: string }[] };

const articles: Article[] = [
  {
    slug: "how-to-choose-an-original-painting",
    en: {
      title: "How to Choose an Original Painting for Your Home",
      description: "A practical guide to choosing original art for your home, from scale and colour to subject, placement and personal connection.",
      intro: "Choosing a painting is not only a question of matching colours. An original artwork becomes part of the atmosphere of a room, and the right choice is usually the one you continue to enjoy looking at over time.",
      sections: [
        { heading: "Start with the feeling, not the furniture", paragraphs: ["Notice what draws you in: a landscape, a city scene, flowers, a quiet horizon or a more expressive composition. Think about the mood you want the work to bring into the room. A painting can complement a space, but it does not have to repeat every colour already in it."] },
        { heading: "Check the scale and the wall", paragraphs: ["Measure the available wall area before choosing. A small work can create an intimate point of focus on a narrow wall, shelf or in a carefully arranged group. A larger painting can hold its own above a sofa or console. Leave enough visual space around the artwork so that it does not feel crowded.", "If you are unsure, mark the intended dimensions on the wall with removable paper. This simple step helps you judge proportion before making a decision."] },
        { heading: "Think about light and viewing distance", paragraphs: ["Look at the wall at different times of day. Strong direct sunlight can gradually affect colours and materials, so a place with indirect or controlled light is generally preferable. Also consider where people will usually see the work from: across the room, while sitting, or close enough to notice brushwork and surface texture."] },
        { heading: "Understand the medium and dimensions", paragraphs: ["Read the artwork details before buying. Oil, acrylic and watercolour have different surface qualities and care considerations. Check the stated dimensions, support and whether a frame is included; do not assume that every work is framed.", "A compact original can be meaningful and visually strong. Size alone does not determine whether a painting will suit your home."] },
        { heading: "Choose a work you want to live with", paragraphs: ["Give yourself time to return to the image. Ask whether the subject, colours or atmosphere still interest you after the first impression. An original painting is a personal choice, and a lasting connection matters more than following a short-lived trend."] },
      ],
      takeaway: "The best painting for your home is one that fits the space thoughtfully and continues to mean something to you.",
    },
    ru: {
      title: "Как выбрать оригинальную картину для дома",
      description: "Практическое руководство по выбору авторской живописи: размер, цвет, сюжет, размещение и личное восприятие.",
      intro: "Выбор картины — это не только подбор цвета под мебель. Оригинальная работа становится частью атмосферы комнаты, и чаще всего правильный выбор — тот, на который вам приятно смотреть снова и снова.",
      sections: [
        { heading: "Начните с ощущения, а не с мебели", paragraphs: ["Обратите внимание, что вас притягивает: пейзаж, городской сюжет, цветы, спокойный горизонт или более экспрессивная композиция. Подумайте, какое настроение вы хотите привнести в комнату. Картина может гармонировать с интерьером, но ей необязательно повторять все его цвета."] },
        { heading: "Оцените размер и стену", paragraphs: ["Измерьте свободное пространство до покупки. Небольшая работа может стать камерным акцентом на узкой стене, полке или в небольшой композиции. Более крупная картина может самостоятельно удерживать внимание над диваном или консолью. Оставьте вокруг неё достаточно свободного пространства.", "Если сомневаетесь, обозначьте предполагаемые размеры на стене листами бумаги или малярной лентой. Так проще оценить пропорции заранее."] },
        { heading: "Учитывайте освещение и расстояние", paragraphs: ["Посмотрите на стену в разное время суток. Прямой солнечный свет со временем может влиять на цвета и материалы, поэтому обычно лучше выбирать место с рассеянным или контролируемым освещением. Подумайте и о дистанции: картину будут рассматривать из другого конца комнаты или вблизи, чтобы увидеть мазки и фактуру?"] },
        { heading: "Изучите технику и размеры", paragraphs: ["Перед покупкой прочитайте описание работы. Масло, акрил и акварель отличаются характером поверхности и требованиями к уходу. Проверьте размеры, основу и наличие рамы — не стоит автоматически считать, что каждая работа уже оформлена.", "Небольшая оригинальная картина тоже может стать сильным визуальным акцентом. Размер сам по себе не определяет, насколько работа подойдёт вашему дому."] },
        { heading: "Выбирайте картину, с которой хочется жить", paragraphs: ["Дайте себе время вернуться к изображению. Подумайте, интересны ли вам сюжет, цвета и настроение не только при первом впечатлении. Оригинальная живопись — личный выбор, и эмоциональная связь важнее кратковременного тренда."] },
      ],
      takeaway: "Хорошая картина для дома — та, которая уместно занимает своё место и продолжает быть вам интересной.",
    },
    related: [
      { slug: "Meadow", en: "Meadow — landscape painting", ru: "Meadow — пейзаж" },
      { slug: "rain", en: "Rain in the City — city painting", ru: "Rain in the City — городской сюжет" },
      { slug: "Mallorca", en: "Coastal Sunset — seascape", ru: "Coastal Sunset — морской пейзаж" },
    ],
  },
  {
    slug: "original-art-vs-print",
    en: {
      title: "Original Art vs Art Prints: What Is the Difference?",
      description: "Learn how an original painting differs from a printed reproduction, including uniqueness, materials, surface and what to check before buying.",
      intro: "An original painting and an art print can both bring an image into a room, but they are different kinds of objects. Understanding the difference helps you choose what suits your interests, space and budget.",
      sections: [
        { heading: "An original is the artwork itself", paragraphs: ["An original painting is the physical work made by the artist. Its surface, marks, layers and small variations belong to that individual object. Unless the artist creates a series, an original is generally a one-of-a-kind work rather than a repeatable copy."] },
        { heading: "A print is a reproduction", paragraphs: ["An art print reproduces an image from an original or a digital artwork. Prints can be produced in editions or as open editions, on different papers and with different printing methods. They can be an accessible way to enjoy an image, but they do not carry the same physical painted surface as the original."] },
        { heading: "Look closely at the materials", paragraphs: ["For an original, check the medium and support: for example, oil on canvas, acrylic on paper or watercolour on paper. For a print, check the paper, printing process, edition information and whether it is signed or numbered. A listing should make clear which type of object is being offered."] },
        { heading: "Consider what matters to you", paragraphs: ["Choose an original if you value the unique physical object, the artist's actual brushwork and owning that particular work. Choose a print if you prefer a reproduction, want a different price point or need several copies. Neither option is automatically right for everyone; clarity in the product description is what matters."] },
        { heading: "Questions to ask before buying", paragraphs: ["Confirm that the listing says original painting or print, check the dimensions and materials, ask whether a frame is included, and review delivery and return terms. If anything is unclear, contact the seller before placing an order."] },
      ],
      takeaway: "The key distinction is simple: an original is the unique physical artwork; a print is a reproduction of an image.",
    },
    ru: {
      title: "Оригинальная картина или принт: в чём разница?",
      description: "Чем авторская живопись отличается от печатной репродукции: уникальность, материалы, фактура и что проверить перед покупкой.",
      intro: "Оригинальная картина и принт могут украшать один и тот же интерьер, но это разные по своей природе объекты. Понимание разницы помогает выбрать то, что подходит вашим интересам, пространству и бюджету.",
      sections: [
        { heading: "Оригинал — это само произведение", paragraphs: ["Оригинальная картина — физическая работа, созданная художником. Её поверхность, мазки, слои и небольшие особенности принадлежат именно этому объекту. Если художник не создаёт серию, оригинал обычно существует в единственном экземпляре, а не как многократно воспроизводимая копия."] },
        { heading: "Принт — это репродукция", paragraphs: ["Арт-принт воспроизводит изображение с оригинала или цифровой работы. Принты могут выпускаться ограниченным или открытым тиражом, на разной бумаге и с использованием разных технологий печати. Это доступный способ оформить изображение, но у него нет той же физической живописной поверхности, что у оригинала."] },
        { heading: "Внимательно изучите материалы", paragraphs: ["Для оригинала проверьте технику и основу: например, масло на холсте, акрил на бумаге или акварель на бумаге. Для принта уточните тип бумаги, способ печати, информацию о тираже, подписи и нумерации. В объявлении должно быть понятно, какой именно объект продаётся."] },
        { heading: "Определите, что важно именно вам", paragraphs: ["Выбирайте оригинал, если цените уникальный физический объект, настоящие мазки художника и владение конкретной работой. Принт подойдёт, если вам нужна репродукция, другой ценовой диапазон или несколько копий. Ни один вариант не является универсально лучшим — важна честная информация о товаре."] },
        { heading: "Что уточнить перед покупкой", paragraphs: ["Проверьте, указано ли, что это оригинальная картина или принт, сверьте размеры и материалы, уточните наличие рамы, условия доставки и возврата. Если описание оставляет вопросы, лучше связаться с продавцом до оплаты."] },
      ],
      takeaway: "Главное отличие простое: оригинал — уникальное физическое произведение, принт — печатное воспроизведение изображения.",
    },
    related: [
      { slug: "Anthuriums", en: "Pink Anthuriums — acrylic on paper", ru: "Pink Anthuriums — акрил на бумаге" },
      { slug: "road-in-the-fog", en: "Mountain Road — watercolour on paper", ru: "Mountain Road — акварель на бумаге" },
      { slug: "Meadow", en: "Meadow — oil on canvas", ru: "Meadow — масло на холсте" },
    ],
  },
  {
    slug: "how-to-care-for-an-original-painting",
    en: {
      title: "How to Care for an Original Painting",
      description: "Practical guidance for protecting original paintings on canvas and paper from direct sunlight, dust, moisture and accidental damage.",
      intro: "A few careful habits can help keep an original painting in good condition. The right approach depends on the medium and support, so always follow any care instructions supplied by the artist.",
      sections: [
        { heading: "Choose a stable place", paragraphs: ["Avoid hanging artwork where it receives strong direct sunlight, sits above a radiator or fireplace, or is exposed to frequent changes in temperature and humidity. Bathrooms, kitchens and damp exterior walls can be challenging environments for many artworks."] },
        { heading: "Handle the surface carefully", paragraphs: ["Hold a painting by its edges or frame and avoid touching the painted surface. Oils from fingers, pressure and accidental scratches can mark the work. Keep food, drinks and plants that may leak or shed debris away from the artwork."] },
        { heading: "Dust gently and only when appropriate", paragraphs: ["For a stable, unvarnished or varnished surface, do not assume that a household cleaning product is safe. Avoid sprays, water, solvents and wet cloths. If the artist confirms that light dusting is suitable, use a clean, very soft dry brush with minimal pressure. If you are uncertain, leave the surface alone and ask a professional conservator."] },
        { heading: "Give works on paper extra protection", paragraphs: ["Watercolour and other works on paper are especially sensitive to moisture and handling. Consider professional framing with suitable archival materials and glazing, while ensuring the artwork does not touch the glass. Keep paper works away from damp and strong light."] },
        { heading: "Ask before cleaning or restoring", paragraphs: ["Do not apply varnish, adhesive, polish or retouching materials yourself. Oil paintings may need specific treatment depending on their age and condition. For stains, flaking paint, mould or structural damage, consult a qualified art conservator rather than attempting a home repair."] },
      ],
      takeaway: "When in doubt, do less: protect the artwork from harsh conditions and ask a conservator before cleaning or restoring it.",
    },
    ru: {
      title: "Как ухаживать за оригинальной картиной",
      description: "Практические советы по защите живописи на холсте и бумаге от прямого солнца, пыли, влаги и случайных повреждений.",
      intro: "Несколько простых привычек помогут сохранить оригинальную картину в хорошем состоянии. Правильный уход зависит от техники и основы, поэтому в первую очередь учитывайте рекомендации художника.",
      sections: [
        { heading: "Выберите стабильное место", paragraphs: ["Не размещайте картину там, где на неё постоянно попадает прямой солнечный свет, рядом находится батарея или камин либо часто меняются температура и влажность. Ванная, кухня и сырые наружные стены могут быть сложной средой для многих произведений искусства."] },
        { heading: "Бережно обращайтесь с поверхностью", paragraphs: ["Берите картину за края или раму и не касайтесь красочного слоя. Жир с пальцев, давление и случайные царапины могут оставить следы. Не размещайте рядом продукты, напитки и растения, которые могут протечь или осыпаться."] },
        { heading: "Удаляйте пыль только безопасным способом", paragraphs: ["Не стоит считать бытовую химию безопасной для лакированной или нелаковой поверхности. Избегайте спреев, воды, растворителей и влажной ткани. Если художник подтвердил, что лёгкое удаление пыли допустимо, используйте чистую очень мягкую сухую кисть без нажима. Если сомневаетесь, не трогайте поверхность и обратитесь к профессиональному реставратору."] },
        { heading: "Особенно берегите работы на бумаге", paragraphs: ["Акварель и другие произведения на бумаге чувствительны к влаге и прикосновениям. Можно рассмотреть профессиональное оформление с подходящими архивными материалами и стеклом, при этом работа не должна соприкасаться со стеклом. Держите бумагу вдали от сырости и сильного света."] },
        { heading: "Не чистите и не реставрируйте самостоятельно", paragraphs: ["Не наносите самостоятельно лак, клей, полироль или материалы для подкрашивания. Масляная живопись может требовать особого подхода в зависимости от возраста и состояния. При пятнах, осыпании краски, плесени или повреждении основы обратитесь к квалифицированному реставратору."] },
      ],
      takeaway: "Если сомневаетесь, лучше не экспериментировать: защитите картину от неблагоприятных условий и проконсультируйтесь с реставратором.",
    },
    related: [
      { slug: "road-in-the-fog", en: "Mountain Road — watercolour on paper", ru: "Mountain Road — акварель на бумаге" },
      { slug: "Anthuriums", en: "Pink Anthuriums — acrylic on paper", ru: "Pink Anthuriums — акрил на бумаге" },
      { slug: "Mallorca", en: "Coastal Sunset — oil on canvas", ru: "Coastal Sunset — масло на холсте" },
    ],
  },
];

export function generateStaticParams() {
  return ["en", "ru"].flatMap((locale) => articles.map((article) => ({ locale, slug: article.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) return {};
  const ru = locale === "ru";
  const content = ru ? article.ru : article.en;
  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/journal/${slug}`;
  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical,
      languages: { en: `${SITE_URL}/journal/${slug}`, ru: `${SITE_URL}/ru/journal/${slug}`, "x-default": `${SITE_URL}/journal/${slug}` },
    },
    openGraph: { type: "article", title: content.title, description: content.description, url: canonical, siteName: "PETIT.SOT STUDIO" },
  };
}

export default async function JournalArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  const ru = locale === "ru";
  const content = ru ? article.ru : article.en;
  const canonical = `${SITE_URL}${ru ? "/ru" : ""}/journal/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${canonical}#article`,
    headline: content.title,
    description: content.description,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    inLanguage: ru ? "ru" : "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    author: { "@type": "Person", "@id": `${SITE_URL}/#artist`, name: "Olga Trikhleb", url: `${SITE_URL}/about` },
    publisher: { "@type": "Organization", "@id": `${SITE_URL}/#studio`, name: "PETIT.SOT STUDIO", url: SITE_URL },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: ru ? "Главная" : "Home", item: `${SITE_URL}${ru ? "/ru" : ""}` },
      { "@type": "ListItem", position: 2, name: ru ? "Гид" : "Journal", item: `${SITE_URL}${ru ? "/ru" : ""}/journal` },
      { "@type": "ListItem", position: 3, name: content.title, item: canonical },
    ],
  };
  return (
    <main className="text-page about-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <article>
        <section className="about-hero">
          <p className="eyebrow">PETIT.SOT STUDIO · {ru ? "ГИД ПО ИСКУССТВУ" : "ART GUIDE"}</p>
          <h1>{content.title}</h1>
          <div className="about-lead"><span className="about-index">PETIT.SOT / JOURNAL</span><p>{content.intro}</p></div>
        </section>
        {content.sections.map((section, index) => (
          <section className="about-section" key={section.heading}>
            <div className="about-section-label"><span>{String(index + 1).padStart(2, "0")}</span><span>{ru ? "ПРАКТИЧЕСКИЙ СОВЕТ" : "PRACTICAL NOTE"}</span></div>
            <div className="about-section-copy">
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
            </div>
          </section>
        ))}
        <section className="about-originals">
          <p className="eyebrow">{ru ? "ГЛАВНОЕ" : "IN SHORT"}</p>
          <p className="about-originals-statement">{content.takeaway}</p>
          <div className="about-originals-bottom">
            <span>{ru ? "Посмотрите примеры работ" : "Explore examples from the collection"}</span>
            <Link className="arrow-link" href="/works">{ru ? "Каталог картин" : "View paintings"} <span>↗</span></Link>
          </div>
        </section>
        <section className="about-section">
          <div className="about-section-label"><span>↗</span><span>{ru ? "ПРИМЕРЫ" : "RELATED WORKS"}</span></div>
          <div className="about-section-copy">
            <h2>{ru ? "Картины PETIT.SOT STUDIO" : "Paintings at PETIT.SOT STUDIO"}</h2>
            <ul>{article.related.map((item) => <li key={item.slug}><Link href={`/works/${item.slug}`}>{ru ? item.ru : item.en}</Link></li>)}</ul>
            <p><Link href="/journal">{ru ? "Вернуться к руководствам" : "Back to all guides"} ↗</Link></p>
          </div>
        </section>
      </article>
    </main>
  );
}

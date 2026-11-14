import Link from "next/link";
import styles from "./commission-seo.module.css";

const SITE_URL = "https://www.petitsot.com";

export default function CommissionSeoContent({ ru }: { ru: boolean }) {
  const pageUrl = `${SITE_URL}${ru ? "/ru" : ""}/commission`;
  const faqs = ru
    ? [
        { question: "Сколько стоит картина на заказ?", answer: "Предварительная стоимость начинается от 180 евро за небольшой формат. Цена зависит от размера, сюжета и сложности работы. Калькулятор на странице показывает ориентир, а окончательную стоимость Ольга подтверждает после личного рассмотрения идеи." },
        { question: "Можно ли заказать картину по своей фотографии?", answer: "Да. Вы можете приложить фотографию или визуальный референс к заявке — например, пейзаж, вид из окна, любимое место или пример желаемой атмосферы. Изображение поможет Ольге лучше понять вашу задумку." },
        { question: "Можно ли выбрать размер и цвета?", answer: "Да. Укажите желаемую ширину, высоту и цветовую палитру в форме заказа. Если вы пока не уверены в формате, отправьте примерные параметры — детали можно будет обсудить лично." },
        { question: "Сколько времени занимает создание картины?", answer: "Срок зависит от размера и сложности композиции. После изучения заявки Ольга сообщит индивидуальную оценку сроков до подтверждения заказа." },
        { question: "Как оформить заказ?", answer: "Опишите идею, выберите размер, при желании добавьте фотографию-референс и отправьте заявку. Ольга лично рассмотрит запрос и свяжется с вами по электронной почте, чтобы обсудить детали, окончательную цену и сроки. Отправка заявки не требует оплаты." },
      ]
    : [
        { question: "How much does a custom painting cost?", answer: "Indicative commission prices start at €180 for a small format. The final price depends on the canvas size, subject and complexity. The estimator on this page provides an initial guide; Olga confirms the final quote after reviewing your idea." },
        { question: "Can I commission a painting from my own photo?", answer: "Yes. You can attach a photograph or visual reference to your request, such as a landscape, a view from your window, a favourite place or an example of the atmosphere you would like to capture. It helps Olga understand your vision." },
        { question: "Can I choose the canvas size and colours?", answer: "Yes. Enter your preferred width, height and colour palette in the commission form. If you are unsure about the exact format, submit approximate dimensions and discuss the details with Olga." },
        { question: "How long does a painting commission take?", answer: "The timeline depends on the canvas size and the complexity of the composition. After reviewing your request, Olga will provide an individual time estimate before the commission is confirmed." },
        { question: "How do I commission an original painting?", answer: "Describe your idea, choose a canvas size, optionally attach a reference photo and submit the request. Olga personally reviews each enquiry and contacts you by email to discuss the details, final price and timeline. No payment is required to send an enquiry." },
      ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${pageUrl}#service`,
        name: ru ? "Авторская картина на заказ" : "Original painting commission",
        serviceType: ru ? "Индивидуальный заказ авторской живописи" : "Custom original artwork and painting commission",
        description: ru
          ? "Индивидуальная авторская картина художницы Ольги Трихлеб по идее и референсам заказчика."
          : "A personalised original painting created by artist Olga Trikhleb from the client's idea and visual references.",
        provider: { "@type": "Person", "@id": `${SITE_URL}/#artist`, name: "Olga Trikhleb", url: `${SITE_URL}/about` },
        areaServed: { "@type": "Country", name: "Slovakia" },
        url: pageUrl,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "EUR",
          lowPrice: 180,
          availability: "https://schema.org/OnlineOnly",
          url: pageUrl,
          description: ru ? "Предварительная цена; окончательная стоимость зависит от размера и сложности." : "Indicative starting price; final quote depends on size and complexity.",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: ru ? "Главная" : "Home", item: `${SITE_URL}${ru ? "/ru" : ""}` },
          { "@type": "ListItem", position: 2, name: ru ? "Картины на заказ" : "Custom painting commissions", item: pageUrl },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <section className={styles.content} aria-labelledby="commission-guide-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{ru ? "ИНДИВИДУАЛЬНАЯ ЖИВОПИСЬ · PETIT.SOT" : "PERSONALISED ARTWORK · PETIT.SOT STUDIO"}</p>
        <h2 id="commission-guide-title">{ru ? "Авторская картина, созданная по вашей идее." : "A one-of-a-kind painting, created from your idea."}</h2>
        <p className={styles.intro}>{ru
          ? "Заказная живопись — это возможность превратить важное для вас место, воспоминание или образ в оригинальную работу Ольги Трихлеб. Вместо выбора готовой картины вы вместе с художницей определяете сюжет, настроение, формат и цветовое решение."
          : "A painting commission is a way to turn a meaningful place, memory or image into an original work by Olga Trikhleb. Rather than choosing an existing artwork, you begin with your own idea and work with the artist to shape the subject, mood, canvas size and colour palette."}</p>

        <div className={styles.columns}>
          <article>
            <span className={styles.number}>01</span>
            <h3>{ru ? "Пейзажи и места с историей" : "Custom landscape paintings"}</h3>
            <p>{ru
              ? "Атмосферный пейзаж, морской берег, деревенская улица или вид из окна — расскажите, какое место вы хотели бы сохранить в живописи. Фотография поможет передать детали, а художественное решение останется авторским."
              : "An atmospheric landscape, a quiet seascape, a village street or the view from your window — tell Olga about the place you would like to preserve in paint. A reference photograph can guide the details while the interpretation remains the artist's own."}</p>
          </article>
          <article>
            <span className={styles.number}>02</span>
            <h3>{ru ? "Размер и цветовая палитра" : "A personalised size and colour palette"}</h3>
            <p>{ru
              ? "Выберите подходящий формат и опишите предпочтительные оттенки. Можно начать с примерного размера и нескольких слов о желаемом настроении — окончательные детали обсуждаются перед подтверждением заказа."
              : "Choose a canvas format and share the colours you have in mind. You can start with approximate dimensions and a few words about the mood you want to create; the final details are discussed before the commission is confirmed."}</p>
          </article>
          <article>
            <span className={styles.number}>03</span>
            <h3>{ru ? "Личное обсуждение с художницей" : "A personal conversation with the artist"}</h3>
            <p>{ru
              ? "Каждую заявку Ольга рассматривает лично. Она уточнит детали, подтвердит стоимость и ориентировочные сроки, чтобы до начала работы у вас было ясное понимание заказа."
              : "Olga personally reviews every enquiry. She will clarify the brief and confirm the final price and estimated timeline, so you understand the commission before work begins."}</p>
          </article>
        </div>

        <div className={styles.location}>
          <h3>{ru ? "PETIT.SOT STUDIO — независимая художественная студия в Тренчине, Словакия" : "PETIT.SOT STUDIO — an independent art studio in Trenčín, Slovakia"}</h3>
          <p>{ru
            ? "Ольга Трихлеб создаёт оригинальные картины в собственной художественной практике. Заказ начинается с вашей идеи: вы можете описать сюжет, приложить визуальный референс и обсудить индивидуальный формат."
            : "Artist Olga Trikhleb develops her original painting practice at PETIT.SOT STUDIO. Every commission begins with your idea: describe the subject, attach a visual reference and discuss a format made for your space."}</p>
          <p>{ru
            ? <>Посмотрите <Link href="/works">готовые картины</Link> и <Link href="/about">узнайте больше об Ольге</Link>.</>
            : <>Explore the <Link href="/works">original paintings</Link> or <Link href="/about">learn more about Olga Trikhleb</Link>.</>}</p>
        </div>

        <div className={styles.faq}>
          <p className={styles.eyebrow}>{ru ? "ВОПРОСЫ И ОТВЕТЫ" : "QUESTIONS & ANSWERS"}</p>
          <h2>{ru ? "Частые вопросы о картинах на заказ" : "Custom painting commission FAQs"}</h2>
          {faqs.map((faq) => (
            <details key={faq.question} className={styles.faqItem}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
        <div className={styles.bottomCta}>
          <p>{ru ? "Есть идея для картины?" : "Have an idea for a painting?"}</p>
          <Link href="/commission">{ru ? "Оформить заявку" : "Start your commission"} <span>↗</span></Link>
        </div>
      </div>
    </section>
  );
}

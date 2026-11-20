export type OrderLocale = "en" | "ru" | "sk";

export type OrderEmailData = {
  orderNumber: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  buyerLocale: OrderLocale;
  artworkTitle: string;
  artworkSlug: string;
  artworkUrl: string;
  imageUrl: string;
  medium: string;
  size: string;
  year: string;
  amount: string;
  currency: string;
  shippingAddress: string;
  paypalTransactionId: string;
};

type RenderedEmail = { subject: string; html: string; text: string };

const COPY = {
  en: {
    subject: (number: string) => `Order confirmation #${number} — PETIT.SOT STUDIO`,
    title: "Thank you for your order",
    greeting: (name: string) => name ? `Dear ${name},` : "Hello,",
    intro: "Thank you for choosing an original artwork from PETIT.SOT STUDIO. Your PayPal payment has been received.",
    order: "Order number",
    artwork: "Artwork",
    medium: "Technique",
    size: "Size",
    year: "Year",
    total: "Total paid",
    shipping: "Delivery address",
    payment: "Payment status",
    paid: "Payment received",
    noAddress: "No delivery address was provided by PayPal.",
    dispatchTitle: "Shipping information",
    dispatch: "TODO: Add the studio’s confirmed shipping and dispatch information here. No delivery timeframe is currently specified.",
    returns: "Returns & Refunds",
    questions: "If you have any questions, simply reply to this email.",
    footer: "PETIT.SOT STUDIO · Original paintings by Olga Trikhleb",
  },
  ru: {
    subject: (number: string) => `Подтверждение заказа #${number} — PETIT.SOT STUDIO`,
    title: "Спасибо за ваш заказ",
    greeting: (name: string) => name ? `Здравствуйте, ${name}!` : "Здравствуйте!",
    intro: "Спасибо, что выбрали оригинальную работу PETIT.SOT STUDIO. Оплата через PayPal получена.",
    order: "Номер заказа",
    artwork: "Картина",
    medium: "Техника",
    size: "Размер",
    year: "Год",
    total: "Оплачено",
    shipping: "Адрес доставки",
    payment: "Статус оплаты",
    paid: "Оплата получена",
    noAddress: "PayPal не передал адрес доставки.",
    dispatchTitle: "Информация об отправке",
    dispatch: "TODO: Добавить подтверждённую студией информацию об отправке и доставке. Срок доставки пока не указан.",
    returns: "Возвраты и возврат средств",
    questions: "Если у вас есть вопросы, просто ответьте на это письмо.",
    footer: "PETIT.SOT STUDIO · Оригинальная живопись Ольги Трихлеб",
  },
  sk: {
    subject: (number: string) => `Potvrdenie objednávky #${number} — PETIT.SOT STUDIO`,
    title: "Ďakujeme za objednávku",
    greeting: (name: string) => name ? `Dobrý deň, ${name}!` : "Dobrý deň!",
    intro: "Ďakujeme, že ste si vybrali originálne dielo PETIT.SOT STUDIO. Platba cez PayPal bola prijatá.",
    order: "Číslo objednávky",
    artwork: "Obraz",
    medium: "Technika",
    size: "Rozmer",
    year: "Rok",
    total: "Uhradená suma",
    shipping: "Dodacia adresa",
    payment: "Stav platby",
    paid: "Platba prijatá",
    noAddress: "PayPal neposkytol dodaciu adresu.",
    dispatchTitle: "Informácie o odoslaní",
    dispatch: "TODO: Doplniť štúdiom potvrdené informácie o odoslaní a doručení. Termín doručenia zatiaľ nie je uvedený.",
    returns: "Vrátenie tovaru a peňazí",
    questions: "Ak máte otázky, jednoducho odpovedzte na tento e-mail.",
    footer: "PETIT.SOT STUDIO · Originálne obrazy Olgy Trikhleb",
  },
} as const;

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

function safeImageUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function shell(locale: OrderLocale, title: string, body: string): string {
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f1;color:#171717;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f4f1;padding:28px 10px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background:#ffffff;">
<tr><td align="center" style="padding:28px 24px 22px;border-bottom:1px solid #eceae6;">
<div style="font-size:18px;letter-spacing:2.4px;font-weight:600;">PETIT.SOT <span style="color:#aaa;">|</span> STUDIO</div>
<div style="padding-top:7px;color:#999;font-size:9px;letter-spacing:2px;">CONTEMPORARY ART &amp; ORIGINAL PAINTINGS</div>
</td></tr>
<tr><td style="padding:30px 26px 34px;">
<h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:1.3;font-weight:400;">${escapeHtml(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 24px;background:#171717;text-align:center;color:#aaa;font-size:11px;line-height:1.7;">
<div style="color:#fff;letter-spacing:2px;">PETIT.SOT STUDIO</div>
<div>Olga Trikhleb · Original paintings</div>
<a href="https://www.petitsot.com" style="color:#ddd;text-decoration:none;">www.petitsot.com</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr><td style="padding:11px 12px;color:#777;font-size:13px;border-bottom:1px solid #eee;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:11px 12px;color:#171717;font-size:14px;text-align:right;border-bottom:1px solid #eee;vertical-align:top;">${escapeHtml(value || "—")}</td></tr>`;
}

export function renderBuyerOrderEmail(data: OrderEmailData, locale: OrderLocale): RenderedEmail {
  const t = COPY[locale];
  const image = safeImageUrl(data.imageUrl);
  const imageBlock = image
    ? `<tr><td style="padding:18px 14px;text-align:center;"><img src="${escapeHtml(image)}" alt="${escapeHtml(data.artworkTitle)}" width="260" style="display:block;width:100%;max-width:260px;height:auto;margin:0 auto;border:0;"></td></tr>`
    : "";
  const address = data.shippingAddress || t.noAddress;
  const rows = [
    detailRow(t.order, data.orderNumber),
    detailRow(t.artwork, data.artworkTitle),
    detailRow(t.medium, data.medium),
    detailRow(t.size, data.size),
    detailRow(t.year, data.year),
    detailRow(t.total, `${data.amount} ${data.currency}`),
    detailRow(t.shipping, address),
    detailRow(t.payment, t.paid),
  ].join("");
  const htmlBody = `<p style="margin:0 0 14px;color:#333;font-size:15px;line-height:1.7;">${escapeHtml(t.greeting(data.buyerName))}</p>
<p style="margin:0 0 20px;color:#454545;font-size:15px;line-height:1.75;">${escapeHtml(t.intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#faf9f7;border:1px solid #eee;">${imageBlock}${rows}</table>
<h2 style="margin:26px 0 8px;font-size:16px;font-weight:600;">${escapeHtml(t.dispatchTitle)}</h2>
<p style="margin:0 0 18px;color:#555;font-size:14px;line-height:1.7;">${escapeHtml(t.dispatch)}</p>
<p style="margin:20px 0;font-size:14px;line-height:1.7;"><a href="${escapeHtml(`https://www.petitsot.com/${locale === "en" ? "" : `${locale}/`}return-policy`)}" style="color:#171717;text-decoration:underline;">${escapeHtml(t.returns)}</a></p>
<p style="margin:0;color:#555;font-size:14px;line-height:1.7;">${escapeHtml(t.questions)}</p>`;
  const text = [
    t.title, t.greeting(data.buyerName), t.intro, "",
    `${t.order}: ${data.orderNumber}`,
    `${t.artwork}: ${data.artworkTitle}`,
    `${t.medium}: ${data.medium}`,
    `${t.size}: ${data.size}`,
    `${t.year}: ${data.year}`,
    `${t.total}: ${data.amount} ${data.currency}`,
    `${t.shipping}: ${address}`,
    `${t.payment}: ${t.paid}`, "",
    `${t.dispatchTitle}: ${t.dispatch}`,
    `${t.returns}: https://www.petitsot.com/${locale === "en" ? "" : `${locale}/`}return-policy`,
    t.questions,
    "PETIT.SOT STUDIO — https://www.petitsot.com",
  ].join("\n");
  return { subject: t.subject(data.orderNumber), html: shell(locale, t.title, htmlBody), text };
}

const OWNER_COPY = {
  title: "Новый заказ",
  date: "Дата и время",
  buyer: "Покупатель",
  email: "Email",
  address: "Адрес доставки",
  artwork: "Картина",
  slug: "Slug",
  price: "Цена картины",
  total: "Итого оплачено",
  transaction: "PayPal transaction ID",
  locale: "Язык покупателя",
  open: "Открыть страницу работы",
  noAddress: "PayPal не передал адрес доставки.",
};

export function renderOwnerOrderEmail(data: OrderEmailData): RenderedEmail {
  const safeTitle = data.artworkTitle.replace(/[\r\n]+/g, " ").slice(0, 160);
  const subject = `Новый заказ #${data.orderNumber}: ${safeTitle}`;
  const date = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Bratislava" }).format(new Date(data.createdAt));
  const rows = [
    detailRow(OWNER_COPY.date, date),
    detailRow(OWNER_COPY.buyer, data.buyerName),
    detailRow(OWNER_COPY.email, data.buyerEmail),
    detailRow(OWNER_COPY.address, data.shippingAddress || OWNER_COPY.noAddress),
    detailRow(OWNER_COPY.artwork, data.artworkTitle),
    detailRow(OWNER_COPY.slug, data.artworkSlug),
    detailRow(OWNER_COPY.price, `${data.amount} ${data.currency}`),
    detailRow(OWNER_COPY.total, `${data.amount} ${data.currency}`),
    detailRow(OWNER_COPY.transaction, data.paypalTransactionId),
    detailRow(OWNER_COPY.locale, data.buyerLocale.toUpperCase()),
  ].join("");
  const htmlBody = `<p style="margin:0 0 20px;color:#454545;font-size:14px;line-height:1.7;">Зафиксирована успешная оплата нового заказа.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#faf9f7;border:1px solid #eee;">${rows}</table>
<p style="margin:24px 0 0;"><a href="${escapeHtml(data.artworkUrl)}" style="display:inline-block;padding:13px 22px;background:#171717;color:#fff;text-decoration:none;font-size:12px;letter-spacing:1px;">${escapeHtml(OWNER_COPY.open)} ↗</a></p>`;
  const text = [
    subject,
    `${OWNER_COPY.date}: ${date}`,
    `${OWNER_COPY.buyer}: ${data.buyerName}`,
    `${OWNER_COPY.email}: ${data.buyerEmail}`,
    `${OWNER_COPY.address}: ${data.shippingAddress || OWNER_COPY.noAddress}`,
    `${OWNER_COPY.artwork}: ${data.artworkTitle}`,
    `${OWNER_COPY.slug}: ${data.artworkSlug}`,
    `${OWNER_COPY.price}: ${data.amount} ${data.currency}`,
    `${OWNER_COPY.total}: ${data.amount} ${data.currency}`,
    `${OWNER_COPY.transaction}: ${data.paypalTransactionId}`,
    `${OWNER_COPY.locale}: ${data.buyerLocale.toUpperCase()}`,
    `${OWNER_COPY.open}: ${data.artworkUrl}`,
  ].join("\n");
  return { subject, html: shell("ru", OWNER_COPY.title, htmlBody), text };
}

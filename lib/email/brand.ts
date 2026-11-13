type EmailDetail = { label: string; value: string };
type StudioEmail = {
  to: string | string[];
  subject: string;
  preheader?: string;
  title: string;
  greeting?: string;
  paragraphs?: string[];
  details?: EmailDetail[];
  buttonLabel?: string;
  buttonUrl?: string;
  footerNote?: string;
  text?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]!);
}

function senderAddress(from: string) {
  return from.includes("<") ? from : `PETIT.SOT STUDIO <${from}>`;
}

export async function sendStudioEmail(message: StudioEmail) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!key || !from) {
    console.error("PETIT.SOT email is not configured");
    return false;
  }

  const details = message.details ?? [];
  const paragraphs = message.paragraphs ?? [];
  const detailRows = details.map(({ label, value }) =>
    `<tr><td style="padding:11px 14px;color:#777;font-size:13px;border-bottom:1px solid #eee;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:11px 14px;color:#171717;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #eee;">${escapeHtml(value)}</td></tr>`
  ).join("");
  const paragraphHtml = paragraphs.map((p) =>
    `<p style="margin:0 0 13px;color:#454545;font-size:15px;line-height:1.75;">${escapeHtml(p)}</p>`
  ).join("");
  const button = message.buttonUrl && message.buttonLabel
    ? `<div style="padding:26px 0 10px;text-align:center;"><a href="${escapeHtml(message.buttonUrl)}" style="display:inline-block;padding:15px 28px;background:#171717;color:#fff;text-decoration:none;font-size:12px;letter-spacing:1.2px;font-weight:700;">${escapeHtml(message.buttonLabel)}</a></div><p style="margin:10px 0 0;color:#999;font-size:11px;line-height:1.6;text-align:center;">If the button does not work, copy this link:<br><a href="${escapeHtml(message.buttonUrl)}" style="color:#666;word-break:break-all;">${escapeHtml(message.buttonUrl)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f5f4f1;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(message.preheader ?? message.title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f1;padding:32px 12px;"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;">
  <tr><td style="padding:30px 34px 25px;text-align:center;border-bottom:1px solid #eceae6;">
  <img src="https://www.petitsot.com/favicon.png" width="42" height="42" alt="PETIT.SOT STUDIO" style="display:block;margin:0 auto 12px;border:0;">
  <div style="font-family:Arial,sans-serif;font-size:17px;letter-spacing:2.6px;color:#171717;font-weight:600;">PETIT.SOT <span style="color:#aaa;">|</span> STUDIO</div>
  <div style="margin-top:7px;font-family:Arial,sans-serif;font-size:9px;letter-spacing:2px;color:#999;">CONTEMPORARY ART &amp; ORIGINAL PAINTINGS</div>
  </td></tr>
  <tr><td style="padding:36px 34px 38px;">
  <h1 style="margin:0 0 20px;color:#171717;font-family:Georgia,serif;font-size:27px;line-height:1.25;font-weight:400;">${escapeHtml(message.title)}</h1>
  ${message.greeting ? `<p style="margin:0 0 14px;color:#333;font-size:15px;line-height:1.7;">${escapeHtml(message.greeting)}</p>` : ""}
  ${paragraphHtml}
  ${details.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#faf9f7;border:1px solid #eee;">${detailRows}</table>` : ""}
  ${button}
  ${message.footerNote ? `<p style="margin:27px 0 0;padding-top:19px;border-top:1px solid #eee;color:#888;font-size:12px;line-height:1.7;">${escapeHtml(message.footerNote)}</p>` : ""}
  </td></tr>
  <tr><td style="padding:22px 30px;background:#171717;text-align:center;">
  <div style="color:#fff;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;">PETIT.SOT STUDIO</div>
  <div style="margin-top:8px;color:#aaa;font-family:Arial,sans-serif;font-size:11px;">Olga Trikhleb · Original paintings</div>
  <div style="margin-top:9px;color:#aaa;font-family:Arial,sans-serif;font-size:11px;"><a href="https://www.petitsot.com" style="color:#ddd;text-decoration:none;">www.petitsot.com</a></div>
  </td></tr></table>
  </td></tr></table></body></html>`;

  const plain = message.text ?? [
    message.title,
    message.greeting ?? "",
    ...paragraphs,
    ...details.map((item) => `${item.label}: ${item.value}`),
    message.buttonLabel && message.buttonUrl ? `${message.buttonLabel}: ${message.buttonUrl}` : "",
    message.footerNote ?? "",
    "PETIT.SOT STUDIO — https://www.petitsot.com",
  ].filter(Boolean).join("\n\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: senderAddress(from),
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html,
      text: plain,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("PETIT.SOT branded email rejected", response.status, (await response.text()).slice(0, 500));
    return false;
  }
  return true;
}

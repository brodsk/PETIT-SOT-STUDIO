import "server-only";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY?.trim() || process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || process.env.CONTACT_FROM_EMAIL?.trim();
  if (!apiKey) throw new Error("EMAIL_API_KEY is not configured");
  if (!from) throw new Error("EMAIL_FROM is not configured");
  if (!message.to || !message.subject) throw new Error("Email recipient and subject are required");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    // Do not include provider response bodies: they may contain recipient PII.
    throw new Error(`Resend API returned HTTP ${response.status}`);
  }
}

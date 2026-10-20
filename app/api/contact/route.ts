import {NextResponse} from "next/server";

export const runtime = "nodejs";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const recentRequests = new Map<string, number[]>();

function allowRequest(ip: string, now = Date.now()) {
  const recent = (recentRequests.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    recentRequests.set(ip, recent);
    return false;
  }
  recent.push(now);
  recentRequests.set(ip, recent);
  // Keep this process-local map bounded. Turnstile remains the primary bot defense.
  if (recentRequests.size > 1000) {
    for (const [key, times] of recentRequests) {
      if (!times.some((time) => now - time < WINDOW_MS)) recentRequests.delete(key);
    }
  }
  return true;
}

function validEmail(email: string) {
  if (email.length > 254 || /[\s<>(),;:\\[\]]/.test(email)) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || !domain || !domain.includes(".")) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  return domain.split(".").every((part) =>
    part.length > 0 && part.length <= 63 && /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(part)
  );
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Keeps the existing form operational until the Turnstile keys are added in Vercel.
  // Once the secret is configured, every submission must carry a valid token.
  if (!secret) return {ok: true, configured: false};
  if (!token) return {ok: false, configured: true};

  const form = new URLSearchParams({secret, response: token});
  if (ip && ip !== "unknown") form.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: form,
    cache: "no-store",
  });
  if (!response.ok) return {ok: false, configured: true};
  const result = await response.json() as {success?: boolean; hostname?: string};
  const allowedHostnames = ["petitsot.com", "www.petitsot.com"];
  return {
    ok: result.success === true && (!result.hostname || allowedHostnames.includes(result.hostname)),
    configured: true,
  };
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 12_000) {
      return NextResponse.json({error: "Request too large"}, {status: 413});
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = (forwardedFor?.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
    if (!allowRequest(ip)) {
      return NextResponse.json({error: "Too many requests. Please try again later."}, {status: 429});
    }

    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const message = String(body?.message || "").trim();
    const website = String(body?.website || "").trim();
    const turnstileToken = String(body?.turnstileToken || "").trim();

    // Silently accept honeypot submissions without sending anything.
    if (website) return NextResponse.json({ok: true});

    if (!name || name.length > 80 || !validEmail(email) || !message || message.length > 4000) {
      return NextResponse.json({error: "Please check the form fields."}, {status: 400});
    }

    const captcha = await verifyTurnstile(turnstileToken, ip);
    if (!captcha.ok) {
      return NextResponse.json({error: "Please complete the security check and try again."}, {status: 400});
    }
    if (!captcha.configured) {
      console.warn("Contact form CAPTCHA is not configured; add TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY in Vercel.");
    }

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const primaryChatId = process.env.TELEGRAM_CHAT_ID;
    const additionalChatIds = String(process.env.TELEGRAM_ADDITIONAL_CHAT_IDS || "")
      .split(",").map((id) => id.trim()).filter(Boolean);
    const chatIds = [primaryChatId, ...additionalChatIds].filter(
      (id, index, arr): id is string => Boolean(id) && arr.indexOf(id) === index
    );

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;
    const emailConfigured = Boolean(resendKey && fromEmail);
    if ((!telegramToken || chatIds.length === 0) && !emailConfigured) {
      console.error("Contact form has no configured delivery channel");
      return NextResponse.json({error: "Contact form is temporarily unavailable."}, {status: 503});
    }

    const sentAt = new Date().toLocaleString("en-GB", {timeZone: "Europe/Bratislava"});
    const telegramText = [
      "✦ PETITSOT — NEW CONTACT",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "Message:",
      message,
      "",
      `Sent: ${sentAt}`,
    ].join("\n");

    const deliveries: Promise<{channel: string; ok: boolean; detail?: string}>[] = [];

    if (telegramToken && chatIds.length) {
      for (const chatId of chatIds) {
        deliveries.push((async () => {
          try {
            const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({chat_id: chatId, text: telegramText}),
              cache: "no-store",
            });
            return {channel: "telegram", ok: response.ok, detail: response.ok ? undefined : await response.text()};
          } catch (error) {
            return {channel: "telegram", ok: false, detail: String(error)};
          }
        })());
      }
    }

    if (emailConfigured) {
      deliveries.push((async () => {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: ["manager@petitsot.com"],
              reply_to: email,
              subject: `PETITSOT contact form — ${name.replace(/[\r\n]+/g, " ").slice(0, 80)}`,
              text: [
                "New message from the PETITSOT website contact form",
                "",
                `Name: ${name}`,
                `Sender email: ${email}`,
                `Received: ${sentAt} (Europe/Bratislava)`,
                "",
                "Message:",
                message,
              ].join("\n"),
            }),
            cache: "no-store",
          });
          return {channel: "email", ok: response.ok, detail: response.ok ? undefined : await response.text()};
        } catch (error) {
          return {channel: "email", ok: false, detail: String(error)};
        }
      })());
    } else {
      console.warn("Contact email delivery is not configured; add RESEND_API_KEY and CONTACT_FROM_EMAIL in Vercel.");
    }

    const results = await Promise.all(deliveries);
    const successful = results.some((result) => result.ok);
    for (const result of results) {
      if (!result.ok) console.error(`Contact ${result.channel} delivery failed:`, result.detail || "unknown error");
    }
    if (!successful) {
      return NextResponse.json({error: "Message could not be delivered. Please try again later."}, {status: 502});
    }

    return NextResponse.json({
      ok: true,
      emailConfigured,
      emailSent: results.some((result) => result.channel === "email" && result.ok),
    });
  } catch (error) {
    console.error("Contact form error", error);
    return NextResponse.json({error: "Invalid request"}, {status: 400});
  }
}

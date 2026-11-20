import "server-only";
import { createAdminClient } from "../supabase/admin";
import { localizeMedium } from "../medium";
import { sendEmail } from "./send";
import { renderBuyerOrderEmail, renderOwnerOrderEmail, type OrderEmailData, type OrderLocale } from "./order-templates";

function localeOf(value: unknown): OrderLocale {
  return value === "ru" || value === "sk" ? value : "en";
}

function formatAddress(value: any): string {
  if (!value || typeof value !== "object") return "";
  return [
    value.name,
    value.line1,
    value.line2,
    [value.postal_code, value.city].filter(Boolean).join(" "),
    value.state,
    value.country,
  ].filter((part) => typeof part === "string" && part.trim()).join(", ");
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 160) : "Unknown email delivery error";
}

async function claimEmail(db: ReturnType<typeof createAdminClient>, orderId: string, kind: "buyer" | "owner") {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const sentColumn = kind === "buyer" ? "buyer_email_sent_at" : "owner_email_sent_at";
  const claimColumn = kind === "buyer" ? "buyer_email_claimed_at" : "owner_email_claimed_at";
  const { data, error } = await db.from("petit_sot_orders")
    .update({ [claimColumn]: now.toISOString() })
    .eq("id", orderId)
    .is(sentColumn, null)
    .or(`${claimColumn}.is.null,${claimColumn}.lt.${staleBefore}`)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function releaseWithError(db: ReturnType<typeof createAdminClient>, orderId: string, kind: "buyer" | "owner", reason: string) {
  const claimColumn = kind === "buyer" ? "buyer_email_claimed_at" : "owner_email_claimed_at";
  await db.from("petit_sot_orders").update({
    [claimColumn]: null,
    email_error: `${kind}: ${reason}`,
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);
  console.error("PETIT.SOT order email failed", { orderId, kind, reason });
}

async function sendOne(db: ReturnType<typeof createAdminClient>, orderId: string, kind: "buyer" | "owner", data: OrderEmailData) {
  const claimed = await claimEmail(db, orderId, kind);
  if (!claimed) return "skipped" as const;

  const claimColumn = kind === "buyer" ? "buyer_email_claimed_at" : "owner_email_claimed_at";
  const sentColumn = kind === "buyer" ? "buyer_email_sent_at" : "owner_email_sent_at";
  try {
    if (kind === "buyer") {
      if (!data.buyerEmail) throw new Error("PayPal did not provide a buyer email address");
      const rendered = renderBuyerOrderEmail(data, data.buyerLocale);
      await sendEmail({
        to: data.buyerEmail,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: process.env.EMAIL_REPLY_TO?.trim() || undefined,
        idempotencyKey: `${orderId}-buyer-confirmation`,
      });
    } else {
      const ownerEmail = process.env.OWNER_NOTIFY_EMAIL?.trim();
      if (!ownerEmail) throw new Error("OWNER_NOTIFY_EMAIL is not configured");
      const rendered = renderOwnerOrderEmail(data);
      await sendEmail({
        to: ownerEmail,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: process.env.EMAIL_REPLY_TO?.trim() || undefined,
        idempotencyKey: `${orderId}-owner-notification`,
      });
    }

    const { error } = await db.from("petit_sot_orders").update({
      [sentColumn]: new Date().toISOString(),
      [claimColumn]: null,
      updated_at: new Date().toISOString(),
    }).eq("id", orderId);
    if (error) throw error;
    return "sent" as const;
  } catch (error) {
    await releaseWithError(db, orderId, kind, safeError(error));
    return "failed" as const;
  }
}

export async function sendOrderEmails(orderId: string) {
  const db = createAdminClient();
  const { data: order, error: orderError } = await db.from("petit_sot_orders")
    .select("*").eq("id", orderId).maybeSingle();
  if (orderError) throw orderError;
  if (!order || order.status !== "paid") return { buyer: "skipped", owner: "skipped" } as const;

  const { data: artwork, error: artworkError } = await db.from("petit_sot_artworks")
    .select("slug,title,title_en,title_sk,year,medium,width_cm,height_cm,thumbnail_path,web_image_path,image_path")
    .eq("id", order.artwork_id).maybeSingle();
  if (artworkError) throw artworkError;
  if (!artwork) throw new Error("Order artwork record was not found");

  const locale = localeOf(order.buyer_locale);
  const title = locale === "ru"
    ? String(artwork.title || artwork.title_en || artwork.slug)
    : locale === "sk"
      ? String(artwork.title_sk || artwork.title_en || artwork.title || artwork.slug)
      : String(artwork.title_en || artwork.title || artwork.slug);
  const size = [artwork.width_cm, artwork.height_cm].filter((v: unknown) => v !== null && v !== undefined && v !== "").join(" × ");
  const imagePath = artwork.thumbnail_path || artwork.web_image_path || artwork.image_path;
  const imageUrl = imagePath
    ? db.storage.from("petit-sot-artworks").getPublicUrl(imagePath).data.publicUrl
    : "";
  const data: OrderEmailData = {
    orderNumber: `PS-${String(order.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    createdAt: String(order.created_at),
    buyerName: String(order.buyer_name || ""),
    buyerEmail: String(order.buyer_email || ""),
    buyerLocale: locale,
    artworkTitle: title,
    artworkSlug: String(artwork.slug),
    artworkUrl: `https://www.petitsot.com/works/${encodeURIComponent(String(artwork.slug))}`,
    imageUrl,
    medium: localizeMedium(artwork.medium || "—", locale),
    size: size ? `${size} cm` : "—",
    year: artwork.year ? String(artwork.year) : "—",
    amount: Number(order.amount_eur || 0).toFixed(2),
    currency: String(order.currency || "EUR"),
    shippingAddress: formatAddress(order.shipping_address),
    paypalTransactionId: String(order.paypal_capture_id || order.paypal_order_id || "—"),
  };

  const buyer = await sendOne(db, orderId, "buyer", data);
  const owner = await sendOne(db, orderId, "owner", data);
  const { data: finalOrder } = await db.from("petit_sot_orders")
    .select("buyer_email_sent_at,owner_email_sent_at").eq("id", orderId).maybeSingle();
  if (finalOrder?.buyer_email_sent_at && finalOrder?.owner_email_sent_at) {
    await db.from("petit_sot_orders").update({ email_error: null }).eq("id", orderId);
  }
  return { buyer, owner };
}

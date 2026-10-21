import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/admin";
import { getEbayApplicationToken, getEbayUserAccessToken } from "../../../../../../lib/ebay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = "https://api.ebay.com/commerce/notification/v1";
const ENDPOINT = "https://www.petitsot.com/api/ebay/notifications";
const ALERT_EMAIL = "manager@petitsot.com";

async function call(path: string, token: string, method = "GET", body?: unknown) {
  const response = await fetch(API + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data, headers: response.headers };
}

export async function POST() {
  await requireAdmin();

  const verificationToken = process.env.EBAY_NOTIFICATION_VERIFICATION_TOKEN?.trim();
  if (!verificationToken) {
    return NextResponse.json({ error: "eBay notification verification token is not configured." }, { status: 503 });
  }

  try {
    const appToken = await getEbayApplicationToken();
    const userToken = await getEbayUserAccessToken();

    const config = await call("/config", appToken);
    if (!config.ok) {
      const createdConfig = await call("/config", appToken, "PUT", { alertEmail: ALERT_EMAIL });
      if (!createdConfig.ok) {
        return NextResponse.json({
          error: "Could not configure eBay notification alert email.",
          httpStatus: createdConfig.status,
        }, { status: 502 });
      }
    }

    let destinations = await call("/destination", appToken);
    if (!destinations.ok) {
      return NextResponse.json({ error: "Could not read eBay notification destinations.", httpStatus: destinations.status }, { status: 502 });
    }
    let destinationList = Array.isArray(destinations.data?.destinations) ? destinations.data.destinations : [];
    let destination = destinationList.find((item: any) => item?.deliveryConfig?.endpoint === ENDPOINT);

    if (!destination) {
      const created = await call("/destination", appToken, "POST", {
        name: "PETIT.SOT order sync",
        status: "ENABLED",
        deliveryConfig: { endpoint: ENDPOINT, verificationToken },
      });
      if (!created.ok && created.status !== 409) {
        const detail = String(created.data?.errors?.[0]?.message || created.data?.message || "eBay rejected the notification destination.");
        return NextResponse.json({ error: detail.slice(0, 220), httpStatus: created.status }, { status: 502 });
      }
      destinations = await call("/destination", appToken);
      destinationList = Array.isArray(destinations.data?.destinations) ? destinations.data.destinations : [];
      destination = destinationList.find((item: any) => item?.deliveryConfig?.endpoint === ENDPOINT);
    }

    const destinationId = String(destination?.destinationId || "");
    if (!destinationId) {
      return NextResponse.json({ error: "eBay did not return the verified destination ID." }, { status: 502 });
    }

    const topicResponse = await call("/topic/ORDER_CONFIRMATION", appToken);
    if (!topicResponse.ok) {
      return NextResponse.json({ error: "Could not read eBay ORDER_CONFIRMATION topic.", httpStatus: topicResponse.status }, { status: 502 });
    }
    const topic = topicResponse.data || {};
    const schemaVersions = Array.isArray(topic?.schemaVersions) ? topic.schemaVersions : [];
    const schemaVersion = String(schemaVersions[0]?.schemaVersion || schemaVersions[0] || "1.0");

    const subscriptionsResponse = await call("/subscription", userToken);
    if (!subscriptionsResponse.ok) {
      return NextResponse.json({
        error: "Could not read eBay subscriptions. The current seller authorization may need to be renewed with notification scopes.",
        httpStatus: subscriptionsResponse.status,
      }, { status: 502 });
    }
    const subscriptions = Array.isArray(subscriptionsResponse.data?.subscriptions) ? subscriptionsResponse.data.subscriptions : [];
    let subscription = subscriptions.find((item: any) => item?.topicId === "ORDER_CONFIRMATION" && item?.destinationId === destinationId);

    if (!subscription) {
      const created = await call("/subscription", userToken, "POST", {
        topicId: "ORDER_CONFIRMATION",
        destinationId,
        status: "ENABLED",
        payload: {
          format: "JSON",
          schemaVersion,
          deliveryProtocol: "HTTPS",
        },
      });
      if (!created.ok) {
        const detail = String(created.data?.errors?.[0]?.message || created.data?.message || "eBay rejected the order subscription.");
        return NextResponse.json({ error: detail.slice(0, 220), httpStatus: created.status }, { status: 502 });
      }
      subscription = created.data || { topicId: "ORDER_CONFIRMATION", destinationId, status: "ENABLED" };
    }

    return NextResponse.json({
      ok: true,
      endpoint: ENDPOINT,
      destination: { id: destinationId, status: destination.status || "ENABLED" },
      subscription: {
        id: subscription?.subscriptionId || null,
        topicId: subscription?.topicId || "ORDER_CONFIRMATION",
        status: subscription?.status || "ENABLED",
        schemaVersion,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json({
      error: String(error?.message || "Could not configure eBay order notifications.").slice(0, 220),
    }, { status: 502 });
  }
}

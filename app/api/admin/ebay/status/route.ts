import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin";
import { getEbayUserAccessToken } from "../../../../../lib/ebay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = "https://api.ebay.com";

async function ebayGet(path: string, token: string) {
  const response = await fetch(API + path, {
    headers: { Authorization: "Bearer " + token, Accept: "application/json" },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

function apiErrorSummary(data: any) {
  const errors = Array.isArray(data?.errors) ? data.errors : [];
  return errors.slice(0, 3).map((item: any) => ({
    errorId: item?.errorId ?? null,
    domain: String(item?.domain || ""),
    category: String(item?.category || ""),
    message: String(item?.message || "").slice(0, 240),
  }));
}

function policySummary(result: { ok: boolean; status: number; data: any }) {
  const items = Array.isArray(result.data?.fulfillmentPolicies)
    ? result.data.fulfillmentPolicies
    : Array.isArray(result.data?.paymentPolicies)
      ? result.data.paymentPolicies
      : Array.isArray(result.data?.returnPolicies)
        ? result.data.returnPolicies
        : [];
  return {
    ok: result.ok,
    httpStatus: result.status,
    count: items.length,
    errors: apiErrorSummary(result.data),
    policies: items.slice(0, 20).map((p: any) => ({
      id: String(p.fulfillmentPolicyId || p.paymentPolicyId || p.returnPolicyId || ""),
      name: String(p.name || ""),
      marketplaceId: String(p.marketplaceId || ""),
    })),
  };
}

export async function GET() {
  await requireAdmin();

  try {
    const token = await getEbayUserAccessToken();
    const [privileges, orders, locations, usFulfillment, usPayment, usReturns, deFulfillment, dePayment, deReturns] =
      await Promise.all([
        ebayGet("/sell/account/v1/privilege", token),
        ebayGet("/sell/fulfillment/v1/order?limit=1", token),
        ebayGet("/sell/inventory/v1/location?limit=20", token),
        ebayGet("/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US&limit=20", token),
        ebayGet("/sell/account/v1/payment_policy?marketplace_id=EBAY_US&limit=20", token),
        ebayGet("/sell/account/v1/return_policy?marketplace_id=EBAY_US&limit=20", token),
        ebayGet("/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_DE&limit=20", token),
        ebayGet("/sell/account/v1/payment_policy?marketplace_id=EBAY_DE&limit=20", token),
        ebayGet("/sell/account/v1/return_policy?marketplace_id=EBAY_DE&limit=20", token),
      ]);

    const locationItems = Array.isArray(locations.data?.locations) ? locations.data.locations : [];
    return NextResponse.json({
      connected: true,
      tokenRefresh: "ok",
      sellerPrivileges: {
        ok: privileges.ok,
        httpStatus: privileges.status,
        sellerRegistrationCompleted: privileges.data?.sellerRegistrationCompleted ?? null,
        status: privileges.data?.status ?? null,
        errors: apiErrorSummary(privileges.data),
      },
      ordersApi: {
        ok: orders.ok,
        httpStatus: orders.status,
        returned: Array.isArray(orders.data?.orders) ? orders.data.orders.length : 0,
        total: Number.isFinite(Number(orders.data?.total)) ? Number(orders.data.total) : null,
      },
      inventoryLocations: {
        ok: locations.ok,
        httpStatus: locations.status,
        errors: apiErrorSummary(locations.data),
        count: locationItems.length,
        locations: locationItems.slice(0, 20).map((x: any) => ({
          key: String(x.merchantLocationKey || ""),
          name: String(x.name || ""),
          status: String(x.location?.address?.country || ""),
        })),
      },
      policies: {
        EBAY_US: {
          fulfillment: policySummary(usFulfillment),
          payment: policySummary(usPayment),
          returns: policySummary(usReturns),
        },
        EBAY_DE: {
          fulfillment: policySummary(deFulfillment),
          payment: policySummary(dePayment),
          returns: policySummary(deReturns),
        },
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    const message = String(error?.message || "eBay connection check failed.");
    return NextResponse.json({
      connected: false,
      error: message.slice(0, 180),
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

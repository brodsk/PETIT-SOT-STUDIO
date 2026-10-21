import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINT = "https://www.petitsot.com/api/ebay/account-deletion";

export async function GET(request: NextRequest) {
  const challengeCode = request.nextUrl.searchParams.get("challenge_code");
  const verificationToken = process.env.EBAY_ACCOUNT_DELETION_VERIFICATION_TOKEN;

  if (!challengeCode) {
    return NextResponse.json({ error: "Missing challenge_code" }, { status: 400 });
  }

  if (!verificationToken) {
    return NextResponse.json({ error: "Endpoint is not configured" }, { status: 500 });
  }

  const challengeResponse = createHash("sha256")
    .update(challengeCode + verificationToken + ENDPOINT, "utf8")
    .digest("hex");

  return NextResponse.json({ challengeResponse }, { status: 200 });
}

export async function POST(request: NextRequest) {
  // PETIT.SOT does not currently persist eBay buyer account data.
  // Acknowledge the deletion notification without logging or storing its payload.
  // If buyer data is added to the integration later, delete it here and verify
  // X-EBAY-SIGNATURE before acting on notification contents.
  const verificationToken = process.env.EBAY_ACCOUNT_DELETION_VERIFICATION_TOKEN;

  if (!verificationToken) {
    return NextResponse.json({ error: "Endpoint is not configured" }, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}

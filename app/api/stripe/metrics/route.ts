import { NextResponse } from "next/server";

import { getLatestMetricSnapshot, listMetricSnapshots } from "@/lib/database";
import { PAYWALL_COOKIE_NAME, verifyPaywallToken } from "@/lib/paywall";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const cookieHeader = request.headers.get("cookie") || "";
  const token =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${PAYWALL_COOKIE_NAME}=`))
      ?.split("=")[1] || undefined;

  if (!verifyPaywallToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || "96");

  return NextResponse.json({
    latestSnapshot: getLatestMetricSnapshot(),
    snapshots: listMetricSnapshots(Number.isFinite(limit) ? Math.min(limit, 300) : 96)
  });
}

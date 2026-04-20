import { NextResponse } from "next/server";
import { z } from "zod";

import { getAlertSettings, listAlertEvents, updateAlertSettings } from "@/lib/database";
import { PAYWALL_COOKIE_NAME, verifyPaywallToken } from "@/lib/paywall";

export const runtime = "nodejs";

const updateSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  chargebackThreshold: z.number().min(0.001).max(0.5),
  disputeThreshold: z.number().int().min(1).max(1000),
  complianceThreshold: z.number().int().min(0).max(100),
  riskScoreThreshold: z.number().min(1).max(100)
});

function isAuthorized(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  const token =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${PAYWALL_COOKIE_NAME}=`))
      ?.split("=")[1] || undefined;

  return Boolean(verifyPaywallToken(token));
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    settings: getAlertSettings(),
    alerts: listAlertEvents(30)
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid alert settings payload" }, { status: 400 });
  }

  const updated = updateAlertSettings(parsed.data);
  return NextResponse.json({ settings: updated });
}

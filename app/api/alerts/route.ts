import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser, setAlertSettings } from "@/lib/db";
import { getDeliveryReadiness } from "@/lib/alerts";
import { applyPaidCookie, applySessionCookie, hasPaidCookie, resolveUserId } from "@/lib/session";

const settingsSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  emailTo: z.string().email(),
  phoneTo: z.string(),
  riskThreshold: z.number().min(10).max(100),
  cooldownMinutes: z.number().min(15).max(1440),
  sendDailyDigest: z.boolean(),
});

function sanitizePhone(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  return trimmed;
}

export async function GET(request: NextRequest) {
  const { userId, isNew } = resolveUserId(request);
  const user = await getOrCreateUser(userId);

  if (!(hasPaidCookie(request) || user.paid)) {
    const denied = NextResponse.json({ error: "Subscription required." }, { status: 402 });
    if (isNew) applySessionCookie(denied, userId);
    return denied;
  }

  const response = NextResponse.json({
    settings: user.alertSettings,
    readiness: getDeliveryReadiness(),
  });

  if (isNew) applySessionCookie(response, userId);
  applyPaidCookie(response);
  return response;
}

export async function POST(request: NextRequest) {
  const { userId, isNew } = resolveUserId(request);
  const user = await getOrCreateUser(userId);

  if (!(hasPaidCookie(request) || user.paid)) {
    const denied = NextResponse.json({ error: "Subscription required." }, { status: 402 });
    if (isNew) applySessionCookie(denied, userId);
    return denied;
  }

  try {
    const payload = settingsSchema.parse(await request.json());

    const settings = await setAlertSettings(userId, {
      ...payload,
      phoneTo: sanitizePhone(payload.phoneTo),
      emailTo: payload.emailTo.trim(),
    });

    const response = NextResponse.json({
      ok: true,
      settings,
      readiness: getDeliveryReadiness(),
    });

    if (isNew) applySessionCookie(response, userId);
    applyPaidCookie(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update settings.";
    const response = NextResponse.json({ error: message }, { status: 400 });
    if (isNew) applySessionCookie(response, userId);
    applyPaidCookie(response);
    return response;
  }
}

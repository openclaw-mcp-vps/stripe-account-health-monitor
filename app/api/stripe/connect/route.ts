import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser, markUserPaid, saveStripeConnection } from "@/lib/db";
import { validateStripeSecretKey, verifyCheckoutSessionPaid } from "@/lib/stripe";
import { applyPaidCookie, applySessionCookie, hasPaidCookie, resolveUserId } from "@/lib/session";

const connectPayloadSchema = z.object({
  secretKey: z
    .string()
    .min(20, "Stripe key looks too short.")
    .regex(/^sk_(test|live)_/, "Use a Stripe secret key that starts with sk_test_ or sk_live_."),
});

export async function GET(request: NextRequest) {
  const { userId, isNew } = resolveUserId(request);
  await getOrCreateUser(userId);

  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL("/dashboard?unlock_error=missing_session", request.url));
  }

  try {
    const paidSession = await verifyCheckoutSessionPaid(sessionId);

    if (!paidSession) {
      return NextResponse.redirect(new URL("/dashboard?unlock_error=not_paid", request.url));
    }

    await markUserPaid(userId, paidSession.customerEmail);

    const response = NextResponse.redirect(new URL("/dashboard?unlocked=1", request.url));
    applyPaidCookie(response);

    if (isNew) {
      applySessionCookie(response, userId);
    }

    return response;
  } catch (error) {
    console.error("Checkout verification failed", error);
    return NextResponse.redirect(new URL("/dashboard?unlock_error=verification_failed", request.url));
  }
}

export async function POST(request: NextRequest) {
  const { userId, isNew } = resolveUserId(request);
  const user = await getOrCreateUser(userId);

  if (!(hasPaidCookie(request) || user.paid)) {
    const deniedResponse = NextResponse.json(
      { error: "Purchase required before connecting a Stripe account." },
      { status: 403 },
    );

    if (isNew) {
      applySessionCookie(deniedResponse, userId);
    }

    return deniedResponse;
  }

  try {
    const payload = connectPayloadSchema.parse(await request.json());
    const account = await validateStripeSecretKey(payload.secretKey);

    await saveStripeConnection(userId, payload.secretKey, account.id, account.displayName);

    const response = NextResponse.json({
      ok: true,
      account,
    });

    if (isNew) {
      applySessionCookie(response, userId);
    }

    applyPaidCookie(response);
    return response;
  } catch (error) {
    console.error("Stripe connection failed", error);

    const message = error instanceof Error ? error.message : "Stripe connection failed.";
    const response = NextResponse.json({ error: message }, { status: 400 });

    if (isNew) {
      applySessionCookie(response, userId);
    }

    return response;
  }
}

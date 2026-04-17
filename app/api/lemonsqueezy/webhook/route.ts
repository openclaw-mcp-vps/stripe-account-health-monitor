import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { upsertPaidCustomer } from "@/lib/database";

function secureCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");
  const payload = await request.text();

  if (!webhookSecret || !signature) {
    return NextResponse.json({ ok: false, message: "Missing webhook configuration." }, { status: 400 });
  }

  const digest = createHmac("sha256", webhookSecret).update(payload, "utf8").digest("hex");

  if (!secureCompare(digest, signature)) {
    return NextResponse.json({ ok: false, message: "Invalid Lemon Squeezy signature." }, { status: 401 });
  }

  let body: {
    meta?: { event_name?: string };
    data?: {
      id?: string;
      attributes?: {
        user_email?: string;
        status?: string;
      };
    };
  };

  try {
    body = JSON.parse(payload);
  } catch {
    return NextResponse.json({ ok: false, message: "Malformed JSON payload." }, { status: 400 });
  }

  const eventName = body.meta?.event_name;
  const email = body.data?.attributes?.user_email;

  if (!email) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const subscriptionStatus = body.data?.attributes?.status;

  if (
    eventName === "order_created" ||
    eventName === "subscription_created" ||
    eventName === "subscription_resumed" ||
    (eventName === "subscription_updated" && subscriptionStatus === "active")
  ) {
    await upsertPaidCustomer({
      email,
      source: "lemonsqueezy",
      purchasedAt: new Date().toISOString(),
      orderId: body.data?.id,
      status: "active",
    });
  }

  if (
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired" ||
    (eventName === "subscription_updated" && subscriptionStatus === "cancelled")
  ) {
    await upsertPaidCustomer({
      email,
      source: "lemonsqueezy",
      purchasedAt: new Date().toISOString(),
      orderId: body.data?.id,
      status: "refunded",
    });
  }

  return NextResponse.json({ ok: true });
}

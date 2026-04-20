import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";

import { savePaidCustomer } from "@/lib/database";

export const runtime = "nodejs";

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: {
      email?: string;
    };
  };
  data?: {
    id?: string;
    attributes?: {
      user_email?: string;
      customer_email?: string;
    };
  };
}

function extractEventName(payload: LemonWebhookPayload): string {
  return payload.meta?.event_name || "unknown";
}

function extractEmail(payload: LemonWebhookPayload): string | null {
  return (
    payload.data?.attributes?.user_email ||
    payload.data?.attributes?.customer_email ||
    payload.meta?.custom_data?.email ||
    null
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") || "";
  const digest = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  if (!signature || signature !== digest) {
    return NextResponse.json({ error: "Invalid Lemon Squeezy signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as LemonWebhookPayload;
  const eventName = extractEventName(payload);
  const email = extractEmail(payload);
  const orderId = payload.data?.id || null;

  if (email) {
    if (
      [
        "order_created",
        "subscription_created",
        "subscription_payment_success",
        "subscription_resumed"
      ].includes(eventName)
    ) {
      savePaidCustomer(email, orderId, "active");
    }

    if (["subscription_cancelled", "subscription_expired", "subscription_paused"].includes(eventName)) {
      savePaidCustomer(email, orderId, "inactive");
    }
  }

  return NextResponse.json({ received: true, event: eventName });
}

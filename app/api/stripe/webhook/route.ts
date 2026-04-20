import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { runMonitoringCheck } from "@/lib/monitoring";

export const runtime = "nodejs";

const STRIPE_API_VERSION = "2025-08-27.basil";

function buildWebhookClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder_key";
  return new Stripe(apiKey, {
    apiVersion: STRIPE_API_VERSION,
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is required to process Stripe webhooks." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  try {
    const payload = await request.text();
    const stripe = buildWebhookClient();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    const monitoredEventTypes = new Set([
      "charge.dispute.created",
      "charge.dispute.closed",
      "charge.refunded",
      "payout.failed",
      "account.updated",
    ]);

    if (monitoredEventTypes.has(event.type)) {
      try {
        await runMonitoringCheck(`webhook:${event.type}`);
      } catch (error) {
        console.error("Webhook-triggered monitor run failed", error);
      }
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook verification failed.",
      },
      { status: 400 },
    );
  }
}

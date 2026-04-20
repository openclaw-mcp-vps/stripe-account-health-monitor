import { NextResponse } from "next/server";
import Stripe from "stripe";

import { runMonitoringCycle } from "@/lib/stripe-monitor";

export const runtime = "nodejs";

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }

  return new Stripe(secretKey);
}

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      {
        error: `Webhook signature verification failed: ${(error as Error).message}`
      },
      { status: 400 }
    );
  }

  if (
    ["charge.dispute.created", "charge.refunded", "account.updated", "payout.failed"].includes(
      event.type
    )
  ) {
    try {
      await runMonitoringCycle(`stripe_webhook:${event.type}`);
    } catch (error) {
      return NextResponse.json(
        {
          received: true,
          monitored: false,
          error: (error as Error).message
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true, eventType: event.type });
}

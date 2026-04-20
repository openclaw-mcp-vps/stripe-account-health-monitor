import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { appendWebhookLog, markUserPaid } from "@/lib/db";
import { runMonitoringSweep } from "@/lib/monitoring";
import { getWebhookStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getWebhookStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  await appendWebhookLog({
    type: event.type,
    livemode: event.livemode,
    account: event.account ?? undefined,
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const mappedUserId = session.metadata?.userId || session.client_reference_id || undefined;

    if (mappedUserId) {
      await markUserPaid(mappedUserId, session.customer_details?.email || undefined);
    }
  }

  if (
    event.type === "account.updated" ||
    event.type === "charge.dispute.created" ||
    event.type === "charge.dispute.closed"
  ) {
    runMonitoringSweep().catch((error) => {
      console.error("Webhook-triggered monitoring sweep failed", error);
    });
  }

  return NextResponse.json({ received: true });
}

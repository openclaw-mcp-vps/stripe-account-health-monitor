import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createAlertsFromReport, dispatchEmailAlerts } from "@/lib/alert-system";
import { addAlerts, addStripeEvent } from "@/lib/database";
import { buildHealthReport } from "@/lib/health-analyzer";
import { getStripeAccountSnapshot } from "@/lib/stripe-client";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, message: "Stripe webhook secret is not configured." }, { status: 400 });
  }

  if (!signature) {
    return NextResponse.json({ ok: false, message: "Missing Stripe signature." }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: `Signature validation failed: ${(error as Error).message}` },
      { status: 400 }
    );
  }

  await addStripeEvent({
    id: event.id,
    type: event.type,
    createdAt: new Date(event.created * 1000).toISOString(),
    payload: event.data.object,
  });

  if (["account.updated", "capability.updated", "person.updated"].includes(event.type)) {
    const snapshot = await getStripeAccountSnapshot();
    const report = buildHealthReport(snapshot);
    const alerts = createAlertsFromReport(report);
    await addAlerts(alerts);
    await dispatchEmailAlerts(alerts);
  }

  return NextResponse.json({ received: true });
}

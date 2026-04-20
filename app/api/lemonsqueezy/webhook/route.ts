import { NextRequest, NextResponse } from "next/server";
import { verifyLemonSignature } from "@/lib/alerts";
import { updateState } from "@/lib/db";

export const runtime = "nodejs";

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
  };
  data?: {
    attributes?: {
      user_email?: string;
      customer_email?: string;
      status?: string;
      cancelled?: boolean;
    };
  };
}

function pickEmail(payload: LemonWebhookPayload) {
  const email = payload.data?.attributes?.user_email ?? payload.data?.attributes?.customer_email;
  return email?.trim().toLowerCase() ?? "";
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid Lemon Squeezy webhook signature." }, { status: 401 });
  }

  let payload: LemonWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload." }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? "unknown";
  const email = pickEmail(payload);

  if (!email) {
    return NextResponse.json({ received: true, event: eventName, skipped: "No customer email in payload" });
  }

  await updateState((current) => {
    const shouldMarkPaid = [
      "order_created",
      "subscription_created",
      "subscription_payment_success",
      "subscription_resumed",
    ].includes(eventName);

    const shouldRemovePaid = ["subscription_expired", "subscription_cancelled"].includes(eventName);

    let paidCustomers = current.paidCustomers;

    if (shouldMarkPaid && !paidCustomers.some((customer) => customer.email === email)) {
      paidCustomers = [
        ...paidCustomers,
        {
          email,
          createdAt: new Date().toISOString(),
          source: "lemonsqueezy_webhook",
        },
      ];
    }

    if (shouldRemovePaid) {
      paidCustomers = paidCustomers.filter((customer) => customer.email !== email);
    }

    return {
      ...current,
      paidCustomers,
      pendingCheckoutEmails: current.pendingCheckoutEmails.filter((pending) => pending !== email),
    };
  });

  return NextResponse.json({ received: true, event: eventName, email });
}

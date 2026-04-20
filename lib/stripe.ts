import Stripe from "stripe";
import type { HealthMetrics, StripeConnection } from "@/lib/types";

const STRIPE_API_VERSION = "2025-08-27.basil";

function buildStripeClient(apiKey: string) {
  return new Stripe(apiKey, {
    apiVersion: STRIPE_API_VERSION,
    appInfo: {
      name: "stripe-account-health-monitor",
      version: "1.0.0",
    },
  });
}

export function getStripeClient(apiKey?: string) {
  const resolvedKey = apiKey ?? process.env.STRIPE_SECRET_KEY;

  if (!resolvedKey) {
    throw new Error(
      "No Stripe API key configured. Connect an account in the dashboard or set STRIPE_SECRET_KEY.",
    );
  }

  return buildStripeClient(resolvedKey);
}

export async function validateStripeKey(apiKey: string): Promise<{
  accountId: string;
  accountName: string;
  livemode: boolean;
}> {
  const stripe = getStripeClient(apiKey);
  const account = await stripe.accounts.retrieve();

  const accountName =
    account.business_profile?.name ||
    account.settings?.dashboard?.display_name ||
    account.email ||
    "Stripe Account";

  return {
    accountId: account.id,
    accountName,
    livemode: apiKey.startsWith("sk_live_"),
  };
}

function emptyTimeline(days = 7) {
  const now = new Date();
  const points = [] as Array<{ label: string; disputes: number; refunds: number }>;

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - offset);
    points.push({
      label: `${date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })}`,
      disputes: 0,
      refunds: 0,
    });
  }

  return points;
}

function addTimelineValue(
  timeline: Array<{ label: string; disputes: number; refunds: number }>,
  createdUnix: number,
  key: "disputes" | "refunds",
) {
  const label = new Date(createdUnix * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const point = timeline.find((item) => item.label === label);

  if (point) {
    point[key] += 1;
  }
}

export async function fetchAccountHealthMetrics(
  stripeConnection: StripeConnection,
  lookbackDays = 30,
): Promise<HealthMetrics> {
  const stripe = getStripeClient(stripeConnection.apiKey);
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const fromTimestamp = nowInSeconds - lookbackDays * 24 * 60 * 60;

  let successfulCharges = 0;
  let refundCount = 0;
  let blockedPayments = 0;
  let disputeCount = 0;
  let openDisputes = 0;
  let failedPayouts = 0;
  let complianceFlags = 0;

  const timeline = emptyTimeline(7);

  for await (const charge of stripe.charges.list({
    created: { gte: fromTimestamp },
    limit: 100,
  })) {
    if (charge.paid && charge.status === "succeeded") {
      successfulCharges += 1;
    }

    if (charge.refunded || charge.amount_refunded > 0) {
      refundCount += 1;
      addTimelineValue(timeline, charge.created, "refunds");
    }

    if (charge.outcome?.type === "blocked") {
      blockedPayments += 1;
    }
  }

  for await (const dispute of stripe.disputes.list({
    created: { gte: fromTimestamp },
    limit: 100,
  })) {
    disputeCount += 1;
    addTimelineValue(timeline, dispute.created, "disputes");

    if (!["won", "lost"].includes(dispute.status)) {
      openDisputes += 1;
    }
  }

  for await (const payout of stripe.payouts.list({
    created: { gte: fromTimestamp },
    limit: 100,
  })) {
    if (payout.status === "failed") {
      failedPayouts += 1;
    }
  }

  const account = await stripe.accounts.retrieve();
  const currentlyDue = account.requirements?.currently_due?.length ?? 0;
  const pastDue = account.requirements?.past_due?.length ?? 0;
  const disabledReason = account.requirements?.disabled_reason ? 1 : 0;
  complianceFlags = currentlyDue + pastDue + disabledReason;

  const chargebackRate =
    successfulCharges > 0 ? (disputeCount / successfulCharges) * 100 : 0;
  const refundRate = successfulCharges > 0 ? (refundCount / successfulCharges) * 100 : 0;

  return {
    windowDays: lookbackDays,
    successfulCharges,
    disputeCount,
    openDisputes,
    chargebackRate: Number(chargebackRate.toFixed(2)),
    refundCount,
    refundRate: Number(refundRate.toFixed(2)),
    failedPayouts,
    blockedPayments,
    complianceFlags,
    timeline,
  };
}

import { CronJob } from "cron";
import Stripe from "stripe";

import { dispatchAlerts } from "@/lib/alert-system";
import {
  getLatestMetricSnapshot,
  getStripeAccount,
  saveMetricSnapshot,
  updateAlertSettings
} from "@/lib/database";
import type { MonitorRunResult, RiskLevel, StripeHealthSnapshot } from "@/types/stripe-metrics";

const LOOKBACK_DAYS = 30;
export const MONITOR_CRON_SCHEDULE = "*/15 * * * *";

declare global {
  var stripeHealthCron: CronJob | undefined;
}

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(key);
}

function daysAgoUnix(days: number): number {
  return Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
}

function computeRiskLevel(score: number): RiskLevel {
  if (score >= 85) {
    return "critical";
  }
  if (score >= 65) {
    return "high";
  }
  if (score >= 40) {
    return "medium";
  }
  return "low";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function retrieveStripeAccount(stripe: Stripe, accountId: string): Promise<Stripe.Account> {
  if (accountId === "self") {
    return stripe.accounts.retrieveCurrent();
  }

  return stripe.accounts.retrieve(accountId);
}

export async function generateStripeSnapshot(accountId: string): Promise<StripeHealthSnapshot> {
  const stripe = getStripeClient();
  const startTimestamp = daysAgoUnix(LOOKBACK_DAYS);

  const [account, charges, disputes, paymentIntents, payouts] = await Promise.all([
    retrieveStripeAccount(stripe, accountId),
    stripe.charges.list({
      created: { gte: startTimestamp },
      limit: 100
    }),
    stripe.disputes.list({
      created: { gte: startTimestamp },
      limit: 100
    }),
    stripe.paymentIntents.list({
      created: { gte: startTimestamp },
      limit: 100
    }),
    stripe.payouts.list({
      created: { gte: startTimestamp },
      limit: 100
    })
  ]);

  const successfulCharges = charges.data.filter((charge) => charge.status === "succeeded");
  const refundedCharges = successfulCharges.filter((charge) => charge.refunded);
  const failedPaymentIntents = paymentIntents.data.filter((intent) =>
    ["requires_payment_method", "canceled"].includes(intent.status)
  );
  const failedPayouts = payouts.data.filter((payout) => payout.status === "failed");

  const chargeCount = successfulCharges.length;
  const disputeCount = disputes.data.length;
  const refundCount = refundedCharges.length;
  const paymentIntentCount = paymentIntents.data.length;
  const failedPaymentCount = failedPaymentIntents.length;
  const payoutFailures = failedPayouts.length;

  const chargebackRate = disputeCount / Math.max(chargeCount, 1);
  const refundRate = refundCount / Math.max(chargeCount, 1);
  const paymentFailureRate = failedPaymentCount / Math.max(paymentIntentCount, 1);

  const requirements = account.requirements;
  const complianceFlags =
    (requirements?.currently_due?.length || 0) + (requirements?.past_due?.length || 0);

  const latest = getLatestMetricSnapshot();
  const previousDisputes = latest?.disputeCount ?? disputeCount;
  const disputeTrendDelta = disputeCount - previousDisputes;

  let riskScore = 0;
  riskScore += clamp(chargebackRate * 260, 0, 45);
  riskScore += clamp(paymentFailureRate * 140, 0, 20);
  riskScore += clamp(refundRate * 100, 0, 15);
  riskScore += clamp(complianceFlags * 9, 0, 15);
  riskScore += clamp(payoutFailures * 8, 0, 10);

  if (disputeTrendDelta >= 3) {
    riskScore += 10;
  } else if (disputeTrendDelta >= 1) {
    riskScore += 5;
  }

  riskScore = clamp(riskScore, 0, 100);
  const riskLevel = computeRiskLevel(riskScore);

  const notes: string[] = [];

  if (chargebackRate >= 0.0075) {
    notes.push(
      "Chargeback rate is approaching Stripe's monitoring threshold. Prioritize evidence quality and fraud filters."
    );
  }

  if (complianceFlags > 0) {
    notes.push(
      `Stripe account requirements show ${complianceFlags} unresolved compliance item(s). Resolve verification prompts immediately.`
    );
  }

  if (paymentFailureRate >= 0.15) {
    notes.push(
      "Payment failure rate is elevated. Review card decline reasons and retry strategy to reduce suspicious churn patterns."
    );
  }

  if (payoutFailures > 0) {
    notes.push(
      "Failed payouts detected. Confirm bank account details and reserve coverage to prevent payout holds."
    );
  }

  if (notes.length === 0) {
    notes.push(
      "No acute risk signals detected. Continue monitoring for dispute spikes and keep KYC/compliance information current."
    );
  }

  return {
    accountId,
    capturedAt: new Date().toISOString(),
    chargebackRate,
    chargeCount,
    disputeCount,
    refundRate,
    refundCount,
    paymentFailureRate,
    paymentIntentCount,
    failedPaymentCount,
    complianceFlags,
    payoutFailures,
    riskScore,
    riskLevel,
    notes
  };
}

export async function runMonitoringCycle(trigger = "manual"): Promise<MonitorRunResult> {
  const account = getStripeAccount();
  if (!account) {
    throw new Error("No Stripe account has been connected. Connect from the dashboard first.");
  }

  const snapshot = await generateStripeSnapshot(account.accountId);
  const snapshotId = saveMetricSnapshot(snapshot);
  const alerts = await dispatchAlerts(snapshot, snapshotId);

  return {
    snapshot: {
      ...snapshot,
      id: snapshotId
    },
    triggeredRules: alerts.triggeredRules,
    notificationsSent: alerts.notificationsSent
  };
}

export function ensureDefaultAlertSettings(): void {
  updateAlertSettings({});
}

export function startLocalMonitorCron(): void {
  if (globalThis.stripeHealthCron) {
    return;
  }

  const job = new CronJob(MONITOR_CRON_SCHEDULE, async () => {
    try {
      await runMonitoringCycle("cron");
    } catch (error) {
      console.error("Scheduled monitor run failed", error);
    }
  });

  job.start();
  globalThis.stripeHealthCron = job;
}

if (process.env.ENABLE_LOCAL_MONITOR_CRON === "true") {
  startLocalMonitorCron();
}

import cron from "node-cron";
import {
  appendSnapshot,
  getStripeSecretForUser,
  getUser,
  listUsers,
  setUserLastAlert,
} from "@/lib/db";
import { sendRiskAlerts } from "@/lib/alerts";
import { collectStripeMetrics } from "@/lib/stripe";
import { HealthSnapshot, UserAccount } from "@/lib/types";
import { riskLevelFromScore } from "@/lib/utils";

function scoreFromMetrics(metrics: {
  chargebackRate: number;
  disputeVelocity7d: number;
  refundRate30d: number;
  failedPaymentRate7d: number;
  complianceFlags: string[];
}) {
  let score = 0;

  score += Math.min(metrics.chargebackRate * 4000, 45);
  score += Math.min(metrics.disputeVelocity7d * 8, 24);
  score += Math.min(metrics.refundRate30d * 180, 18);
  score += Math.min(metrics.failedPaymentRate7d * 120, 12);
  score += Math.min(metrics.complianceFlags.length * 8, 24);

  return Math.min(Math.round(score), 100);
}

function buildSnapshot(metrics: Awaited<ReturnType<typeof collectStripeMetrics>>): HealthSnapshot {
  const riskScore = scoreFromMetrics({
    chargebackRate: metrics.chargebackRate,
    disputeVelocity7d: metrics.disputeVelocity7d,
    refundRate30d: metrics.refundRate30d,
    failedPaymentRate7d: metrics.failedPaymentRate7d,
    complianceFlags: metrics.complianceFlags,
  });

  return {
    timestamp: new Date().toISOString(),
    successfulChargesLast30Days: metrics.successfulChargesLast30Days,
    disputesLast30Days: metrics.disputesLast30Days,
    disputeVelocity7d: metrics.disputeVelocity7d,
    chargebackRate: metrics.chargebackRate,
    refundRate30d: metrics.refundRate30d,
    failedPaymentRate7d: metrics.failedPaymentRate7d,
    complianceFlags: metrics.complianceFlags,
    notes: metrics.notes,
    riskScore,
    riskLevel: riskLevelFromScore(riskScore),
  };
}

function shouldSendAlert(user: UserAccount, snapshot: HealthSnapshot) {
  if (snapshot.riskScore < user.alertSettings.riskThreshold) {
    return false;
  }

  if (!user.lastAlertAt) {
    return true;
  }

  const cooldownMs = user.alertSettings.cooldownMinutes * 60_000;
  const elapsed = Date.now() - new Date(user.lastAlertAt).getTime();

  if (elapsed < cooldownMs) {
    return false;
  }

  if (typeof user.lastAlertScore === "number" && snapshot.riskScore <= user.lastAlertScore) {
    return false;
  }

  return true;
}

export async function runHealthCheckForUser(userId: string) {
  const user = await getUser(userId);
  const secretKey = await getStripeSecretForUser(user.id);

  if (!secretKey) {
    throw new Error("Connect a Stripe secret key before running monitoring.");
  }

  const metrics = await collectStripeMetrics(secretKey);
  const snapshot = buildSnapshot(metrics);
  const updatedUser = await appendSnapshot(user.id, snapshot);

  if (shouldSendAlert(updatedUser, snapshot)) {
    await sendRiskAlerts(updatedUser, snapshot);
    await setUserLastAlert(updatedUser.id, snapshot.riskScore);
  }

  return {
    snapshot,
    accountId: metrics.accountId,
    accountLabel: metrics.accountLabel,
  };
}

export async function runMonitoringSweep() {
  const users = await listUsers();
  const targets = users.filter((user) => user.paid && user.stripeSecretKeyEncrypted);

  const results = await Promise.allSettled(
    targets.map(async (user) => {
      const result = await runHealthCheckForUser(user.id);
      return {
        userId: user.id,
        riskScore: result.snapshot.riskScore,
      };
    }),
  );

  return results;
}

export function startMonitoringCron() {
  const globalState = globalThis as unknown as {
    __sahmCronStarted?: boolean;
  };

  if (globalState.__sahmCronStarted) {
    return;
  }

  cron.schedule("*/30 * * * *", async () => {
    try {
      await runMonitoringSweep();
    } catch (error) {
      console.error("Monitoring sweep failed", error);
    }
  });

  globalState.__sahmCronStarted = true;
}

import crypto from "node:crypto";
import cron from "node-cron";
import { dispatchAlerts } from "@/lib/alerts";
import { readState, updateState } from "@/lib/db";
import { fetchAccountHealthMetrics } from "@/lib/stripe";
import type {
  AlertThresholds,
  MonitoringRun,
  RiskAssessment,
  RiskLevel,
} from "@/lib/types";

declare global {
  var __stripeMonitorCronStarted: boolean | undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function evaluateRisk(
  metrics: MonitoringRun["metrics"],
  thresholds: AlertThresholds,
): RiskAssessment {
  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  if (metrics.chargebackRate >= thresholds.chargebackRate) {
    const multiplier = metrics.chargebackRate / thresholds.chargebackRate;
    score += clamp(Math.round(26 * multiplier), 26, 42);
    reasons.push(
      `Chargeback rate is ${metrics.chargebackRate}% (threshold ${thresholds.chargebackRate}%).`,
    );
    recommendations.push(
      "Review dispute evidence quality and issue proactive refunds on high-risk transactions.",
    );
  }

  if (metrics.openDisputes >= thresholds.disputeSpike) {
    const overBy = metrics.openDisputes - thresholds.disputeSpike + 1;
    score += clamp(overBy * 8, 10, 28);
    reasons.push(
      `Open disputes are elevated at ${metrics.openDisputes} (threshold ${thresholds.disputeSpike}).`,
    );
    recommendations.push(
      "Respond to open disputes within 24 hours and route highest-value cases to manual review.",
    );
  }

  if (metrics.failedPayouts >= thresholds.failedPayouts) {
    score += clamp(metrics.failedPayouts * 16, 16, 35);
    reasons.push(
      `Failed payouts detected (${metrics.failedPayouts}) which can signal banking or compliance issues.`,
    );
    recommendations.push(
      "Confirm payout bank details and investigate payout failure reasons in Stripe balance settings.",
    );
  }

  if (metrics.complianceFlags >= thresholds.complianceFlags) {
    score += clamp(metrics.complianceFlags * 12, 20, 36);
    reasons.push(
      `Compliance requirements outstanding (${metrics.complianceFlags}) with potential account restriction risk.`,
    );
    recommendations.push(
      "Resolve Stripe account requirements and submit requested documents immediately.",
    );
  }

  if (metrics.blockedPayments > 0) {
    score += clamp(metrics.blockedPayments * 4, 6, 20);
    reasons.push(
      `${metrics.blockedPayments} blocked payments were observed, indicating elevated fraud or policy checks.`,
    );
    recommendations.push(
      "Tighten fraud rules and align product descriptors with customer expectations to lower fraud signals.",
    );
  }

  if (metrics.refundRate >= 8) {
    score += 12;
    reasons.push(`Refund rate is ${metrics.refundRate}%, indicating possible fulfillment or expectation mismatch.`);
    recommendations.push("Improve checkout messaging and post-purchase communication to reduce avoidable refunds.");
  }

  score = clamp(score, 0, 100);

  let level: RiskLevel = "low";
  if (score >= 75) {
    level = "critical";
  } else if (score >= 50) {
    level = "high";
  } else if (score >= 25) {
    level = "medium";
  }

  if (!reasons.length) {
    reasons.push("All monitored indicators are within configured thresholds.");
    recommendations.push("Keep monitoring active and review thresholds monthly as processing volume changes.");
  }

  return {
    level,
    score,
    reasons,
    recommendations,
  };
}

export async function runMonitoringCheck(trigger = "manual"): Promise<MonitoringRun> {
  const state = await readState();

  if (!state.stripeConnection) {
    throw new Error("No Stripe account connected yet.");
  }

  const metrics = await fetchAccountHealthMetrics(state.stripeConnection);
  const risk = evaluateRisk(metrics, state.alertSettings.thresholds);

  let alertsSent: string[] = [];

  if (risk.level === "high" || risk.level === "critical") {
    alertsSent = await dispatchAlerts({
      accountId: state.stripeConnection.accountId,
      metrics,
      risk,
      settings: state.alertSettings,
    });
  }

  const run: MonitoringRun = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    trigger,
    metrics,
    risk,
    alertsSent,
  };

  await updateState((current) => {
    const nextHistory = [...current.monitoringHistory, run].slice(-180);
    return {
      ...current,
      monitoringHistory: nextHistory,
    };
  });

  return run;
}

export async function getDashboardData() {
  const state = await readState();
  const latestRun = state.monitoringHistory[state.monitoringHistory.length - 1] ?? null;

  return {
    stripeConnection: state.stripeConnection,
    alertSettings: state.alertSettings,
    paidCustomers: state.paidCustomers,
    latestRun,
    history: state.monitoringHistory,
  };
}

export function startMonitoringScheduler() {
  if (globalThis.__stripeMonitorCronStarted) {
    return;
  }

  cron.schedule("*/15 * * * *", async () => {
    try {
      const state = await readState();
      if (!state.stripeConnection) {
        return;
      }
      await runMonitoringCheck("scheduler");
    } catch (error) {
      console.error("Scheduled monitoring run failed", error);
    }
  });

  globalThis.__stripeMonitorCronStarted = true;
}

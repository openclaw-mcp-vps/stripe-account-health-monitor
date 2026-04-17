import { z } from "zod";

import type { StripeAccountSnapshot } from "@/lib/stripe-client";

export const HealthLevelSchema = z.enum(["excellent", "stable", "watch", "critical"]);

export type HealthLevel = z.infer<typeof HealthLevelSchema>;

export interface RiskSignal {
  level: "low" | "medium" | "high";
  title: string;
  message: string;
  action: string;
}

export interface HealthReport {
  score: number;
  level: HealthLevel;
  summary: string;
  metrics: {
    id: string;
    label: string;
    value: string;
    hint: string;
  }[];
  risks: RiskSignal[];
}

function formatMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function buildHealthReport(snapshot: StripeAccountSnapshot): HealthReport {
  const risks: RiskSignal[] = [];
  let score = 100;

  if (!snapshot.chargesEnabled) {
    score -= 35;
    risks.push({
      level: "high",
      title: "Charges are disabled",
      message: "Your account cannot process new payments. This is a direct deactivation signal.",
      action: "Review account requirements and submit missing compliance details immediately.",
    });
  }

  if (!snapshot.payoutsEnabled) {
    score -= 25;
    risks.push({
      level: "high",
      title: "Payouts are disabled",
      message: "Payout blocks often indicate unresolved risk or verification concerns.",
      action: "Check your Stripe dashboard for payout restrictions and verification requests.",
    });
  }

  if (snapshot.pastDueCount > 0) {
    score -= 20;
    risks.push({
      level: "high",
      title: `${snapshot.pastDueCount} past-due compliance requirement${snapshot.pastDueCount > 1 ? "s" : ""}`,
      message: "Past-due requirements can escalate to account restrictions or shutdown.",
      action: "Prioritize all past-due KYC/KYB tasks in Stripe's requirements panel.",
    });
  }

  if (snapshot.currentlyDueCount > 0) {
    score -= 12;
    risks.push({
      level: "medium",
      title: `${snapshot.currentlyDueCount} requirement${snapshot.currentlyDueCount > 1 ? "s" : ""} currently due`,
      message: "Unaddressed due requirements increase near-term deactivation risk.",
      action: "Set an owner and deadline to clear due items this week.",
    });
  }

  if (snapshot.eventuallyDueCount > 0) {
    score -= 5;
    risks.push({
      level: "low",
      title: `${snapshot.eventuallyDueCount} upcoming requirement${snapshot.eventuallyDueCount > 1 ? "s" : ""}`,
      message: "These are not urgent yet, but unresolved items can become due with little notice.",
      action: "Schedule a monthly compliance review to keep future requirements under control.",
    });
  }

  if (snapshot.disabledReason) {
    score -= 15;
    risks.push({
      level: "high",
      title: "Stripe reported a disabled reason",
      message: `Stripe returned disabled reason: ${snapshot.disabledReason.replaceAll("_", " ")}.`,
      action: "Escalate to your risk/compliance owner and document remediation steps.",
    });
  }

  score = Math.max(0, score);

  const level: HealthLevel =
    score >= 85 ? "excellent" : score >= 70 ? "stable" : score >= 45 ? "watch" : "critical";

  const summaryByLevel: Record<HealthLevel, string> = {
    excellent: "Account risk is low. Keep monitoring and stay ahead of future requirements.",
    stable: "Account health is good, but there are signals worth watching this week.",
    watch: "Risk is elevated. Address compliance gaps before they trigger account limitations.",
    critical: "High deactivation risk detected. Immediate remediation is recommended.",
  };

  return {
    score,
    level,
    summary: summaryByLevel[level],
    metrics: [
      {
        id: "charges",
        label: "Charges",
        value: snapshot.chargesEnabled ? "Enabled" : "Disabled",
        hint: "Ability to accept payments",
      },
      {
        id: "payouts",
        label: "Payouts",
        value: snapshot.payoutsEnabled ? "Enabled" : "Disabled",
        hint: "Ability to settle funds",
      },
      {
        id: "requirements",
        label: "Open Requirements",
        value: String(snapshot.currentlyDueCount + snapshot.pastDueCount + snapshot.eventuallyDueCount),
        hint: `${snapshot.pastDueCount} past due · ${snapshot.currentlyDueCount} currently due`,
      },
      {
        id: "balance",
        label: "Available Balance",
        value: formatMoney(snapshot.balanceAvailable, snapshot.defaultCurrency ?? "usd"),
        hint: `${formatMoney(snapshot.balancePending, snapshot.defaultCurrency ?? "usd")} pending`,
      },
    ],
    risks,
  };
}

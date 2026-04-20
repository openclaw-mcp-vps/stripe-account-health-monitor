import nodemailer from "nodemailer";
import twilio from "twilio";

import { createAlertEvent, getAlertSettings } from "@/lib/database";
import type { AlertSettings, RiskLevel, StripeHealthSnapshot } from "@/types/stripe-metrics";

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function buildAlertMessage(snapshot: StripeHealthSnapshot, triggeredRules: string[]): string {
  const intro = `Stripe account risk moved to ${snapshot.riskLevel.toUpperCase()} (${snapshot.riskScore.toFixed(
    1
  )}/100).`;

  const metrics = [
    `Chargeback rate: ${formatPercent(snapshot.chargebackRate)}`,
    `Disputes (30d): ${snapshot.disputeCount}`,
    `Refund rate: ${formatPercent(snapshot.refundRate)}`,
    `Payment failures: ${formatPercent(snapshot.paymentFailureRate)}`,
    `Compliance flags: ${snapshot.complianceFlags}`,
    `Failed payouts: ${snapshot.payoutFailures}`
  ];

  return [intro, "", "Triggered rules:", ...triggeredRules.map((rule) => `- ${rule}`), "", ...metrics].join(
    "\n"
  );
}

function severityFromRiskLevel(level: StripeHealthSnapshot["riskLevel"]): RiskLevel {
  if (level === "critical") {
    return "critical";
  }
  if (level === "high") {
    return "high";
  }
  if (level === "medium") {
    return "medium";
  }
  return "low";
}

export function evaluateAlertRules(
  snapshot: StripeHealthSnapshot,
  settings: AlertSettings
): string[] {
  const rules: string[] = [];

  if (snapshot.chargebackRate >= settings.chargebackThreshold) {
    rules.push(
      `Chargeback rate ${formatPercent(snapshot.chargebackRate)} is above threshold ${formatPercent(
        settings.chargebackThreshold
      )}`
    );
  }

  if (snapshot.disputeCount >= settings.disputeThreshold) {
    rules.push(
      `Dispute volume ${snapshot.disputeCount} exceeds threshold ${settings.disputeThreshold}`
    );
  }

  if (snapshot.complianceFlags >= settings.complianceThreshold) {
    rules.push(
      `Compliance flags ${snapshot.complianceFlags} exceed threshold ${settings.complianceThreshold}`
    );
  }

  if (snapshot.riskScore >= settings.riskScoreThreshold) {
    rules.push(
      `Risk score ${snapshot.riskScore.toFixed(1)} exceeds threshold ${settings.riskScoreThreshold.toFixed(
        1
      )}`
    );
  }

  return rules;
}

async function sendEmailAlert(subject: string, body: string): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const alertTo = process.env.ALERT_TO_EMAIL;
  const alertFrom = process.env.ALERT_FROM_EMAIL;

  if (!smtpHost || !smtpUser || !smtpPass || !alertTo || !alertFrom) {
    return false;
  }

  const smtpPort = Number(process.env.SMTP_PORT || "587");

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  await transporter.sendMail({
    from: alertFrom,
    to: alertTo,
    subject,
    text: body
  });

  return true;
}

async function sendSmsAlert(body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.ALERT_TO_PHONE;

  if (!sid || !token || !from || !to) {
    return false;
  }

  const client = twilio(sid, token);
  const compactBody = body.length > 1200 ? `${body.slice(0, 1197)}...` : body;

  await client.messages.create({
    from,
    to,
    body: compactBody
  });

  return true;
}

export async function dispatchAlerts(
  snapshot: StripeHealthSnapshot,
  snapshotId: number
): Promise<{ triggeredRules: string[]; notificationsSent: Array<"email" | "sms"> }> {
  const settings = getAlertSettings();
  const triggeredRules = evaluateAlertRules(snapshot, settings);

  if (triggeredRules.length === 0) {
    return { triggeredRules: [], notificationsSent: [] };
  }

  const severity = severityFromRiskLevel(snapshot.riskLevel);
  const subject = `[Stripe Risk Alert] ${snapshot.riskLevel.toUpperCase()} risk detected`;
  const body = buildAlertMessage(snapshot, triggeredRules);

  const notificationsSent: Array<"email" | "sms"> = [];

  if (settings.emailEnabled) {
    try {
      const sent = await sendEmailAlert(subject, body);
      if (sent) {
        notificationsSent.push("email");
        createAlertEvent({
          channel: "email",
          severity,
          message: subject,
          snapshotId
        });
      }
    } catch (error) {
      createAlertEvent({
        channel: "system",
        severity,
        message: `Email alert failed: ${(error as Error).message}`,
        snapshotId
      });
    }
  }

  if (settings.smsEnabled) {
    try {
      const sent = await sendSmsAlert(body);
      if (sent) {
        notificationsSent.push("sms");
        createAlertEvent({
          channel: "sms",
          severity,
          message: `SMS alert sent for ${snapshot.riskLevel.toUpperCase()} risk`,
          snapshotId
        });
      }
    } catch (error) {
      createAlertEvent({
        channel: "system",
        severity,
        message: `SMS alert failed: ${(error as Error).message}`,
        snapshotId
      });
    }
  }

  if (notificationsSent.length === 0) {
    createAlertEvent({
      channel: "system",
      severity,
      message: `${subject}. Delivery skipped because notification providers are not configured.`,
      snapshotId
    });
  }

  return { triggeredRules, notificationsSent };
}

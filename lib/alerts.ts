import crypto from "node:crypto";
import nodemailer from "nodemailer";
import twilio from "twilio";
import type { AlertSettings, HealthMetrics, RiskAssessment } from "@/lib/types";

interface DispatchPayload {
  accountId: string;
  metrics: HealthMetrics;
  risk: RiskAssessment;
  settings: AlertSettings;
}

function buildMessage(payload: DispatchPayload) {
  const subject = `[Stripe Risk ${payload.risk.level.toUpperCase()}] ${payload.accountId}`;
  const reasonText = payload.risk.reasons.length
    ? payload.risk.reasons.map((item) => `- ${item}`).join("\n")
    : "- Risk score crossed alert threshold.";

  const recommendationText = payload.risk.recommendations.length
    ? payload.risk.recommendations.map((item) => `- ${item}`).join("\n")
    : "- Review Stripe dashboard and resolve outstanding account requirements.";

  const body = `Stripe Account Health Alert\n\nAccount: ${payload.accountId}\nRisk score: ${payload.risk.score}/100\nRisk level: ${payload.risk.level}\nLookback window: ${payload.metrics.windowDays} days\n\nKey metrics:\n- Chargeback rate: ${payload.metrics.chargebackRate}%\n- Disputes: ${payload.metrics.disputeCount} (${payload.metrics.openDisputes} open)\n- Failed payouts: ${payload.metrics.failedPayouts}\n- Compliance flags: ${payload.metrics.complianceFlags}\n\nTriggered reasons:\n${reasonText}\n\nRecommended actions:\n${recommendationText}`;

  return { subject, body };
}

async function sendEmailAlert(
  to: string,
  subject: string,
  body: string,
): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.ALERT_FROM_EMAIL ?? "alerts@stripe-health.local";

  if (!host || !user || !pass || !to) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text: body,
  });

  return true;
}

async function sendSmsAlert(to: string, body: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from || !to) {
    return false;
  }

  const client = twilio(accountSid, authToken);

  await client.messages.create({
    body,
    from,
    to,
  });

  return true;
}

export async function dispatchAlerts(payload: DispatchPayload): Promise<string[]> {
  const sentChannels: string[] = [];
  const { subject, body } = buildMessage(payload);

  if (payload.settings.email.enabled && payload.settings.email.to) {
    try {
      const sent = await sendEmailAlert(payload.settings.email.to, subject, body);
      if (sent) {
        sentChannels.push("email");
      }
    } catch (error) {
      console.error("Failed to send email alert", error);
    }
  }

  if (payload.settings.sms.enabled && payload.settings.sms.to) {
    try {
      const sent = await sendSmsAlert(payload.settings.sms.to, `${subject}\n${body}`);
      if (sent) {
        sentChannels.push("sms");
      }
    } catch (error) {
      console.error("Failed to send SMS alert", error);
    }
  }

  return sentChannels;
}

export function verifyLemonSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const a = Buffer.from(digest, "utf8");
  const b = Buffer.from(signature, "utf8");

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

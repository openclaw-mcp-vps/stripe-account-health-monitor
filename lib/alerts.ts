import nodemailer from "nodemailer";
import twilio from "twilio";
import { HealthSnapshot, UserAccount } from "@/lib/types";

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.ALERT_FROM_EMAIL,
  );
}

function isTwilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

function getRiskHeadline(score: number) {
  if (score >= 80) return "Critical Stripe Risk";
  if (score >= 60) return "High Stripe Risk";
  if (score >= 35) return "Moderate Stripe Risk";
  return "Stripe Risk Update";
}

function renderSummary(user: UserAccount, snapshot: HealthSnapshot) {
  const lines = [
    `${getRiskHeadline(snapshot.riskScore)} for ${user.stripeDisplayName || "your account"}`,
    `Risk score: ${snapshot.riskScore}/100 (${snapshot.riskLevel.toUpperCase()})`,
    `Chargeback rate (30d): ${(snapshot.chargebackRate * 100).toFixed(2)}%`,
    `Disputes (30d): ${snapshot.disputesLast30Days}`,
    `Refund rate (30d): ${(snapshot.refundRate30d * 100).toFixed(2)}%`,
    `Failed payment rate (7d): ${(snapshot.failedPaymentRate7d * 100).toFixed(2)}%`,
  ];

  if (snapshot.complianceFlags.length > 0) {
    lines.push(`Compliance flags: ${snapshot.complianceFlags.join(", ")}`);
  }

  if (snapshot.notes.length > 0) {
    lines.push("Notes:");
    snapshot.notes.forEach((note) => lines.push(`- ${note}`));
  }

  return lines.join("\n");
}

async function sendEmailAlert(to: string, subject: string, content: string) {
  if (!isSmtpConfigured()) {
    console.warn("SMTP credentials are missing; email alert skipped.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL,
    to,
    subject,
    text: content,
  });
}

async function sendSmsAlert(to: string, content: string) {
  if (!isTwilioConfigured()) {
    console.warn("Twilio credentials are missing; SMS alert skipped.");
    return;
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    to,
    from: process.env.TWILIO_FROM_NUMBER,
    body: content.slice(0, 1400),
  });
}

export function getDeliveryReadiness() {
  return {
    smtpReady: isSmtpConfigured(),
    twilioReady: isTwilioConfigured(),
  };
}

export async function sendRiskAlerts(user: UserAccount, snapshot: HealthSnapshot) {
  const subject = `${getRiskHeadline(snapshot.riskScore)} - ${user.stripeDisplayName || "Stripe Account"}`;
  const content = renderSummary(user, snapshot);

  const jobs: Promise<unknown>[] = [];

  if (user.alertSettings.emailEnabled && user.alertSettings.emailTo) {
    jobs.push(sendEmailAlert(user.alertSettings.emailTo, subject, content));
  }

  if (user.alertSettings.smsEnabled && user.alertSettings.phoneTo) {
    jobs.push(sendSmsAlert(user.alertSettings.phoneTo, content));
  }

  await Promise.all(jobs);
}

import { Resend } from "resend";

import type { HealthReport } from "@/lib/health-analyzer";
import type { StoredAlert } from "@/lib/database";

export function createAlertsFromReport(report: HealthReport): StoredAlert[] {
  return report.risks
    .filter((risk) => risk.level !== "low")
    .map((risk) => ({
      id: crypto.randomUUID(),
      level: risk.level,
      title: risk.title,
      message: `${risk.message} Recommended action: ${risk.action}`,
      createdAt: new Date().toISOString(),
      resolved: false,
    }));
}

export async function dispatchEmailAlerts(alerts: StoredAlert[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL_TO;

  if (!apiKey || !to || alerts.length === 0) {
    return;
  }

  const resend = new Resend(apiKey);

  const urgentAlerts = alerts
    .map((alert) => `- [${alert.level.toUpperCase()}] ${alert.title}: ${alert.message}`)
    .join("\n");

  await resend.emails.send({
    from: "Stripe Health Monitor <alerts@stripehealthmonitor.app>",
    to,
    subject: "Stripe account health alert",
    text: `New Stripe risk indicators were detected:\n\n${urgentAlerts}`,
  });
}

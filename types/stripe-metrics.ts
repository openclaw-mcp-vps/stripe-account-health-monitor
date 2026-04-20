export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface StripeAccountConnection {
  accountId: string;
  operatorEmail: string | null;
  connectedAt: string;
  updatedAt: string;
}

export interface StripeHealthSnapshot {
  id?: number;
  accountId: string;
  capturedAt: string;
  chargebackRate: number;
  chargeCount: number;
  disputeCount: number;
  refundRate: number;
  refundCount: number;
  paymentFailureRate: number;
  paymentIntentCount: number;
  failedPaymentCount: number;
  complianceFlags: number;
  payoutFailures: number;
  riskScore: number;
  riskLevel: RiskLevel;
  notes: string[];
}

export interface AlertSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  chargebackThreshold: number;
  disputeThreshold: number;
  complianceThreshold: number;
  riskScoreThreshold: number;
  updatedAt: string;
}

export interface AlertEvent {
  id?: number;
  channel: "email" | "sms" | "system";
  severity: RiskLevel;
  message: string;
  snapshotId: number | null;
  createdAt: string;
}

export interface MonitorRunResult {
  snapshot: StripeHealthSnapshot;
  triggeredRules: string[];
  notificationsSent: Array<"email" | "sms">;
}

export interface DashboardPayload {
  account: StripeAccountConnection | null;
  latestSnapshot: StripeHealthSnapshot | null;
  snapshots: StripeHealthSnapshot[];
  alertSettings: AlertSettings;
  alerts: AlertEvent[];
}

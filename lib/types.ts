export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface HealthSnapshot {
  timestamp: string;
  successfulChargesLast30Days: number;
  disputesLast30Days: number;
  disputeVelocity7d: number;
  chargebackRate: number;
  refundRate30d: number;
  failedPaymentRate7d: number;
  complianceFlags: string[];
  notes: string[];
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface AlertSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailTo: string;
  phoneTo: string;
  riskThreshold: number;
  cooldownMinutes: number;
  sendDailyDigest: boolean;
}

export interface UserAccount {
  id: string;
  createdAt: string;
  updatedAt: string;
  paid: boolean;
  paidAt?: string;
  email?: string;
  stripeSecretKeyEncrypted?: string;
  stripeAccountId?: string;
  stripeDisplayName?: string;
  alertSettings: AlertSettings;
  lastSnapshot?: HealthSnapshot;
  history: HealthSnapshot[];
  lastAlertAt?: string;
  lastAlertScore?: number;
}

export interface WebhookLog {
  id: string;
  receivedAt: string;
  type: string;
  livemode: boolean;
  account?: string;
}

export interface AppStore {
  users: Record<string, UserAccount>;
  webhookLogs: WebhookLog[];
}

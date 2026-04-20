export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface HealthMetrics {
  windowDays: number;
  successfulCharges: number;
  disputeCount: number;
  openDisputes: number;
  chargebackRate: number;
  refundCount: number;
  refundRate: number;
  failedPayouts: number;
  blockedPayments: number;
  complianceFlags: number;
  timeline: Array<{
    label: string;
    disputes: number;
    refunds: number;
  }>;
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  reasons: string[];
  recommendations: string[];
}

export interface AlertThresholds {
  chargebackRate: number;
  disputeSpike: number;
  failedPayouts: number;
  complianceFlags: number;
}

export interface AlertSettings {
  email: {
    enabled: boolean;
    to: string;
  };
  sms: {
    enabled: boolean;
    to: string;
  };
  thresholds: AlertThresholds;
}

export interface StripeConnection {
  accountId: string;
  accountName: string;
  livemode: boolean;
  apiKey: string;
  connectedAt: string;
}

export interface MonitoringRun {
  id: string;
  createdAt: string;
  trigger: string;
  metrics: HealthMetrics;
  risk: RiskAssessment;
  alertsSent: string[];
}

export interface PaidCustomer {
  email: string;
  source: "lemonsqueezy_webhook" | "manual";
  createdAt: string;
}

export interface AppState {
  stripeConnection: StripeConnection | null;
  alertSettings: AlertSettings;
  monitoringHistory: MonitoringRun[];
  paidCustomers: PaidCustomer[];
  pendingCheckoutEmails: string[];
}

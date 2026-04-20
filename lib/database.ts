import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import type {
  AlertEvent,
  AlertSettings,
  StripeAccountConnection,
  StripeHealthSnapshot
} from "@/types/stripe-metrics";

let databaseInstance: Database.Database | null = null;

const DEFAULT_ALERT_SETTINGS: Omit<AlertSettings, "updatedAt"> = {
  emailEnabled: true,
  smsEnabled: false,
  chargebackThreshold: 0.007,
  disputeThreshold: 5,
  complianceThreshold: 2,
  riskScoreThreshold: 65
};

function resolveDatabasePath(): string {
  const configuredPath = process.env.DATABASE_PATH || "./data/monitor.db";
  return path.resolve(process.cwd(), configuredPath);
}

function ensureDatabaseDirectory(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stripe_accounts (
      account_id TEXT PRIMARY KEY,
      operator_email TEXT,
      connected_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS metric_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      chargeback_rate REAL NOT NULL,
      charge_count INTEGER NOT NULL,
      dispute_count INTEGER NOT NULL,
      refund_rate REAL NOT NULL,
      refund_count INTEGER NOT NULL,
      payment_failure_rate REAL NOT NULL,
      payment_intent_count INTEGER NOT NULL,
      failed_payment_count INTEGER NOT NULL,
      compliance_flags INTEGER NOT NULL,
      payout_failures INTEGER NOT NULL,
      risk_score REAL NOT NULL,
      risk_level TEXT NOT NULL,
      notes_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      email_enabled INTEGER NOT NULL,
      sms_enabled INTEGER NOT NULL,
      chargeback_threshold REAL NOT NULL,
      dispute_threshold INTEGER NOT NULL,
      compliance_threshold INTEGER NOT NULL,
      risk_score_threshold REAL NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      snapshot_id INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS paywall_customers (
      email TEXT PRIMARY KEY,
      order_id TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();
  db.prepare(
    `
      INSERT OR IGNORE INTO alert_settings (
        id,
        email_enabled,
        sms_enabled,
        chargeback_threshold,
        dispute_threshold,
        compliance_threshold,
        risk_score_threshold,
        updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    Number(DEFAULT_ALERT_SETTINGS.emailEnabled),
    Number(DEFAULT_ALERT_SETTINGS.smsEnabled),
    DEFAULT_ALERT_SETTINGS.chargebackThreshold,
    DEFAULT_ALERT_SETTINGS.disputeThreshold,
    DEFAULT_ALERT_SETTINGS.complianceThreshold,
    DEFAULT_ALERT_SETTINGS.riskScoreThreshold,
    now
  );
}

function getDb(): Database.Database {
  if (databaseInstance) {
    return databaseInstance;
  }

  const databasePath = resolveDatabasePath();
  ensureDatabaseDirectory(databasePath);
  databaseInstance = new Database(databasePath);
  initializeSchema(databaseInstance);
  return databaseInstance;
}

function mapSnapshotRow(row: Record<string, unknown>): StripeHealthSnapshot {
  return {
    id: Number(row.id),
    accountId: String(row.account_id),
    capturedAt: String(row.captured_at),
    chargebackRate: Number(row.chargeback_rate),
    chargeCount: Number(row.charge_count),
    disputeCount: Number(row.dispute_count),
    refundRate: Number(row.refund_rate),
    refundCount: Number(row.refund_count),
    paymentFailureRate: Number(row.payment_failure_rate),
    paymentIntentCount: Number(row.payment_intent_count),
    failedPaymentCount: Number(row.failed_payment_count),
    complianceFlags: Number(row.compliance_flags),
    payoutFailures: Number(row.payout_failures),
    riskScore: Number(row.risk_score),
    riskLevel: row.risk_level as StripeHealthSnapshot["riskLevel"],
    notes: JSON.parse(String(row.notes_json))
  };
}

export function upsertStripeAccount(accountId: string, operatorEmail: string | null): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO stripe_accounts (account_id, operator_email, connected_at, updated_at)
      VALUES (@account_id, @operator_email, @connected_at, @updated_at)
      ON CONFLICT(account_id)
      DO UPDATE SET operator_email = excluded.operator_email, updated_at = excluded.updated_at
    `
  ).run({
    account_id: accountId,
    operator_email: operatorEmail,
    connected_at: now,
    updated_at: now
  });
}

export function getStripeAccount(): StripeAccountConnection | null {
  const db = getDb();
  const row = db
    .prepare(
      `
        SELECT account_id, operator_email, connected_at, updated_at
        FROM stripe_accounts
        ORDER BY updated_at DESC
        LIMIT 1
      `
    )
    .get() as
    | {
        account_id: string;
        operator_email: string | null;
        connected_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    accountId: row.account_id,
    operatorEmail: row.operator_email,
    connectedAt: row.connected_at,
    updatedAt: row.updated_at
  };
}

export function saveMetricSnapshot(snapshot: StripeHealthSnapshot): number {
  const db = getDb();
  const result = db
    .prepare(
      `
        INSERT INTO metric_snapshots (
          account_id,
          captured_at,
          chargeback_rate,
          charge_count,
          dispute_count,
          refund_rate,
          refund_count,
          payment_failure_rate,
          payment_intent_count,
          failed_payment_count,
          compliance_flags,
          payout_failures,
          risk_score,
          risk_level,
          notes_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      snapshot.accountId,
      snapshot.capturedAt,
      snapshot.chargebackRate,
      snapshot.chargeCount,
      snapshot.disputeCount,
      snapshot.refundRate,
      snapshot.refundCount,
      snapshot.paymentFailureRate,
      snapshot.paymentIntentCount,
      snapshot.failedPaymentCount,
      snapshot.complianceFlags,
      snapshot.payoutFailures,
      snapshot.riskScore,
      snapshot.riskLevel,
      JSON.stringify(snapshot.notes)
    );

  return Number(result.lastInsertRowid);
}

export function listMetricSnapshots(limit = 96): StripeHealthSnapshot[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT * FROM metric_snapshots
      ORDER BY captured_at DESC
      LIMIT ?
    `
    )
    .all(limit) as Record<string, unknown>[];

  return rows.map(mapSnapshotRow).reverse();
}

export function getLatestMetricSnapshot(): StripeHealthSnapshot | null {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT * FROM metric_snapshots
      ORDER BY captured_at DESC
      LIMIT 1
    `
    )
    .get() as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return mapSnapshotRow(row);
}

export function getAlertSettings(): AlertSettings {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT email_enabled, sms_enabled, chargeback_threshold, dispute_threshold, compliance_threshold, risk_score_threshold, updated_at
      FROM alert_settings
      WHERE id = 1
    `
    )
    .get() as
    | {
        email_enabled: number;
        sms_enabled: number;
        chargeback_threshold: number;
        dispute_threshold: number;
        compliance_threshold: number;
        risk_score_threshold: number;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    return {
      ...DEFAULT_ALERT_SETTINGS,
      updatedAt: new Date().toISOString()
    };
  }

  return {
    emailEnabled: Boolean(row.email_enabled),
    smsEnabled: Boolean(row.sms_enabled),
    chargebackThreshold: row.chargeback_threshold,
    disputeThreshold: row.dispute_threshold,
    complianceThreshold: row.compliance_threshold,
    riskScoreThreshold: row.risk_score_threshold,
    updatedAt: row.updated_at
  };
}

export function updateAlertSettings(partial: Partial<Omit<AlertSettings, "updatedAt">>): AlertSettings {
  const current = getAlertSettings();

  const merged: AlertSettings = {
    emailEnabled: partial.emailEnabled ?? current.emailEnabled,
    smsEnabled: partial.smsEnabled ?? current.smsEnabled,
    chargebackThreshold: partial.chargebackThreshold ?? current.chargebackThreshold,
    disputeThreshold: partial.disputeThreshold ?? current.disputeThreshold,
    complianceThreshold: partial.complianceThreshold ?? current.complianceThreshold,
    riskScoreThreshold: partial.riskScoreThreshold ?? current.riskScoreThreshold,
    updatedAt: new Date().toISOString()
  };

  const db = getDb();
  db.prepare(
    `
      UPDATE alert_settings
      SET
        email_enabled = ?,
        sms_enabled = ?,
        chargeback_threshold = ?,
        dispute_threshold = ?,
        compliance_threshold = ?,
        risk_score_threshold = ?,
        updated_at = ?
      WHERE id = 1
    `
  ).run(
    Number(merged.emailEnabled),
    Number(merged.smsEnabled),
    merged.chargebackThreshold,
    merged.disputeThreshold,
    merged.complianceThreshold,
    merged.riskScoreThreshold,
    merged.updatedAt
  );

  return merged;
}

export function createAlertEvent(event: Omit<AlertEvent, "id" | "createdAt">): number {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `
      INSERT INTO alert_events (channel, severity, message, snapshot_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(event.channel, event.severity, event.message, event.snapshotId, now);

  return Number(result.lastInsertRowid);
}

export function listAlertEvents(limit = 25): AlertEvent[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id, channel, severity, message, snapshot_id, created_at
      FROM alert_events
      ORDER BY created_at DESC
      LIMIT ?
    `
    )
    .all(limit) as Array<{
    id: number;
    channel: AlertEvent["channel"];
    severity: AlertEvent["severity"];
    message: string;
    snapshot_id: number | null;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    channel: row.channel,
    severity: row.severity,
    message: row.message,
    snapshotId: row.snapshot_id,
    createdAt: row.created_at
  }));
}

export function savePaidCustomer(email: string, orderId: string | null, status = "active"): void {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();
  const db = getDb();

  db.prepare(
    `
      INSERT INTO paywall_customers (email, order_id, status, created_at, updated_at)
      VALUES (@email, @order_id, @status, @created_at, @updated_at)
      ON CONFLICT(email)
      DO UPDATE SET
        order_id = COALESCE(excluded.order_id, paywall_customers.order_id),
        status = excluded.status,
        updated_at = excluded.updated_at
    `
  ).run({
    email: normalizedEmail,
    order_id: orderId,
    status,
    created_at: now,
    updated_at: now
  });
}

export function isPaidCustomer(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const db = getDb();
  const row = db
    .prepare(`SELECT status FROM paywall_customers WHERE email = ? LIMIT 1`)
    .get(normalizedEmail) as { status: string } | undefined;

  return row?.status === "active";
}

export function closeDatabase(): void {
  if (databaseInstance) {
    databaseInstance.close();
    databaseInstance = null;
  }
}

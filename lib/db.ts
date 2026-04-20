import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AlertSettings,
  AppState,
  MonitoringRun,
  PaidCustomer,
  StripeConnection,
} from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");

const defaultAlertSettings: AlertSettings = {
  email: {
    enabled: true,
    to: "",
  },
  sms: {
    enabled: false,
    to: "",
  },
  thresholds: {
    chargebackRate: 0.75,
    disputeSpike: 3,
    failedPayouts: 1,
    complianceFlags: 2,
  },
};

const defaultState: AppState = {
  stripeConnection: null,
  alertSettings: defaultAlertSettings,
  monitoringHistory: [],
  paidCustomers: [],
  pendingCheckoutEmails: [],
};

let initialized = false;

async function ensureDataFile() {
  if (initialized) {
    return;
  }

  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(defaultState, null, 2), "utf8");
  }

  initialized = true;
}

function sanitizeState(partial: Partial<AppState>): AppState {
  return {
    stripeConnection: (partial.stripeConnection ?? null) as StripeConnection | null,
    alertSettings: {
      ...defaultAlertSettings,
      ...(partial.alertSettings ?? {}),
      email: {
        ...defaultAlertSettings.email,
        ...(partial.alertSettings?.email ?? {}),
      },
      sms: {
        ...defaultAlertSettings.sms,
        ...(partial.alertSettings?.sms ?? {}),
      },
      thresholds: {
        ...defaultAlertSettings.thresholds,
        ...(partial.alertSettings?.thresholds ?? {}),
      },
    },
    monitoringHistory: (partial.monitoringHistory ?? []) as MonitoringRun[],
    paidCustomers: (partial.paidCustomers ?? []) as PaidCustomer[],
    pendingCheckoutEmails: partial.pendingCheckoutEmails ?? [],
  };
}

export async function readState(): Promise<AppState> {
  await ensureDataFile();

  const raw = await readFile(DATA_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return sanitizeState(parsed);
  } catch {
    await writeState(defaultState);
    return defaultState;
  }
}

export async function writeState(state: AppState): Promise<void> {
  await ensureDataFile();
  await writeFile(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
}

export async function updateState(
  updater: (state: AppState) => AppState | Promise<AppState>,
): Promise<AppState> {
  const current = await readState();
  const next = await updater(current);
  await writeState(next);
  return next;
}

export function getDefaultAlertSettings(): AlertSettings {
  return JSON.parse(JSON.stringify(defaultAlertSettings)) as AlertSettings;
}

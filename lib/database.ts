import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface StoredAlert {
  id: string;
  level: "low" | "medium" | "high";
  title: string;
  message: string;
  createdAt: string;
  resolved: boolean;
}

export interface StoredStripeEvent {
  id: string;
  type: string;
  createdAt: string;
  payload: unknown;
}

export interface StoredCustomer {
  email: string;
  source: "lemonsqueezy";
  purchasedAt: string;
  orderId?: string;
  status: "active" | "refunded";
}

interface AppDatabase {
  alerts: StoredAlert[];
  stripeEvents: StoredStripeEvent[];
  customers: StoredCustomer[];
}

const DB_DIR = join(process.cwd(), "data");
const DB_FILE = join(DB_DIR, "app-db.json");

const EMPTY_DB: AppDatabase = {
  alerts: [],
  stripeEvents: [],
  customers: [],
};

async function ensureDbExists() {
  await mkdir(DB_DIR, { recursive: true });
  try {
    await readFile(DB_FILE, "utf8");
  } catch {
    await writeFile(DB_FILE, JSON.stringify(EMPTY_DB, null, 2), "utf8");
  }
}

async function readDb(): Promise<AppDatabase> {
  await ensureDbExists();
  const raw = await readFile(DB_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<AppDatabase>;
  return {
    alerts: parsed.alerts ?? [],
    stripeEvents: parsed.stripeEvents ?? [],
    customers: parsed.customers ?? [],
  };
}

async function writeDb(nextDb: AppDatabase) {
  await ensureDbExists();
  await writeFile(DB_FILE, JSON.stringify(nextDb, null, 2), "utf8");
}

export async function addStripeEvent(event: StoredStripeEvent) {
  const db = await readDb();
  const exists = db.stripeEvents.some((item) => item.id === event.id);
  if (!exists) {
    db.stripeEvents.unshift(event);
    db.stripeEvents = db.stripeEvents.slice(0, 200);
    await writeDb(db);
  }
}

export async function addAlerts(alerts: StoredAlert[]) {
  if (alerts.length === 0) {
    return;
  }
  const db = await readDb();
  const existingTitles = new Set(db.alerts.filter((a) => !a.resolved).map((a) => a.title));

  for (const alert of alerts) {
    if (!existingTitles.has(alert.title)) {
      db.alerts.unshift(alert);
    }
  }

  db.alerts = db.alerts.slice(0, 100);
  await writeDb(db);
}

export async function listOpenAlerts() {
  const db = await readDb();
  return db.alerts.filter((alert) => !alert.resolved).slice(0, 20);
}

export async function upsertPaidCustomer(customer: StoredCustomer) {
  const db = await readDb();
  const index = db.customers.findIndex((entry) => entry.email.toLowerCase() === customer.email.toLowerCase());

  if (index >= 0) {
    db.customers[index] = customer;
  } else {
    db.customers.push(customer);
  }

  await writeDb(db);
}

export async function hasActiveAccess(email: string) {
  const db = await readDb();
  return db.customers.some(
    (customer) => customer.email.toLowerCase() === email.toLowerCase() && customer.status === "active"
  );
}

export async function listRecentStripeEvents() {
  const db = await readDb();
  return db.stripeEvents.slice(0, 20);
}

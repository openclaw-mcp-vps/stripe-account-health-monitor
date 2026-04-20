import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppStore, AlertSettings, HealthSnapshot, UserAccount, WebhookLog } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const HISTORY_LIMIT = 240;

const ENCRYPTION_KEY = createHash("sha256")
  .update(process.env.APP_ENCRYPTION_KEY || "dev-only-change-me")
  .digest();

let writeQueue: Promise<unknown> = Promise.resolve();

function defaultAlertSettings(email = ""): AlertSettings {
  return {
    emailEnabled: true,
    smsEnabled: false,
    emailTo: email,
    phoneTo: "",
    riskThreshold: 60,
    cooldownMinutes: 120,
    sendDailyDigest: true,
  };
}

function defaultStore(): AppStore {
  return {
    users: {},
    webhookLogs: [],
  };
}

async function readStore(): Promise<AppStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AppStore;
    if (!parsed.users || !parsed.webhookLogs) {
      return defaultStore();
    }
    return parsed;
  } catch {
    return defaultStore();
  }
}

async function writeStore(store: AppStore) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmpFile = `${STORE_PATH}.${randomUUID()}.tmp`;
  await writeFile(tmpFile, JSON.stringify(store, null, 2), "utf8");
  await rename(tmpFile, STORE_PATH);
}

async function mutateStore<T>(mutator: (store: AppStore) => Promise<T> | T): Promise<T> {
  const next = writeQueue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });

  writeQueue = next.catch(() => undefined);
  return next;
}

function encryptSecret(secret: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptSecret(payload?: string): string | null {
  if (!payload) return null;

  const [ivB64, authTagB64, dataB64] = payload.split(":");
  if (!ivB64 || !authTagB64 || !dataB64) return null;

  const decipher = createDecipheriv(
    "aes-256-gcm",
    ENCRYPTION_KEY,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function withDefaults(user: UserAccount): UserAccount {
  return {
    ...user,
    history: user.history ?? [],
    alertSettings: {
      ...defaultAlertSettings(user.email ?? ""),
      ...user.alertSettings,
    },
  };
}

function createUser(id: string): UserAccount {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    paid: false,
    alertSettings: defaultAlertSettings(),
    history: [],
  };
}

export async function getUser(userId: string): Promise<UserAccount> {
  const store = await readStore();
  const user = store.users[userId] ?? createUser(userId);
  return withDefaults(user);
}

export async function getOrCreateUser(userId: string): Promise<UserAccount> {
  return mutateStore((store) => {
    if (!store.users[userId]) {
      store.users[userId] = createUser(userId);
    }

    store.users[userId].updatedAt = new Date().toISOString();
    return withDefaults(store.users[userId]);
  });
}

export async function updateUser(
  userId: string,
  updater: (current: UserAccount) => UserAccount,
): Promise<UserAccount> {
  return mutateStore((store) => {
    const current = withDefaults(store.users[userId] ?? createUser(userId));
    const updated = updater(current);
    updated.updatedAt = new Date().toISOString();
    store.users[userId] = updated;
    return withDefaults(updated);
  });
}

export async function markUserPaid(userId: string, email?: string): Promise<UserAccount> {
  return updateUser(userId, (current) => {
    const paidAt = current.paidAt ?? new Date().toISOString();
    return {
      ...current,
      paid: true,
      paidAt,
      email: email ?? current.email,
      alertSettings: {
        ...current.alertSettings,
        emailTo: current.alertSettings.emailTo || email || "",
      },
    };
  });
}

export async function saveStripeConnection(
  userId: string,
  secretKey: string,
  accountId: string,
  displayName: string,
): Promise<UserAccount> {
  return updateUser(userId, (current) => ({
    ...current,
    stripeSecretKeyEncrypted: encryptSecret(secretKey),
    stripeAccountId: accountId,
    stripeDisplayName: displayName,
  }));
}

export async function getStripeSecretForUser(userId: string): Promise<string | null> {
  const user = await getUser(userId);
  return decryptSecret(user.stripeSecretKeyEncrypted);
}

export async function setAlertSettings(
  userId: string,
  patch: Partial<AlertSettings>,
): Promise<AlertSettings> {
  const updated = await updateUser(userId, (current) => ({
    ...current,
    alertSettings: {
      ...current.alertSettings,
      ...patch,
    },
  }));

  return updated.alertSettings;
}

export async function appendSnapshot(
  userId: string,
  snapshot: HealthSnapshot,
): Promise<UserAccount> {
  return updateUser(userId, (current) => ({
    ...current,
    lastSnapshot: snapshot,
    history: [...current.history, snapshot].slice(-HISTORY_LIMIT),
  }));
}

export async function setUserLastAlert(
  userId: string,
  riskScore: number,
): Promise<UserAccount> {
  return updateUser(userId, (current) => ({
    ...current,
    lastAlertAt: new Date().toISOString(),
    lastAlertScore: riskScore,
  }));
}

export async function listUsers(): Promise<UserAccount[]> {
  const store = await readStore();
  return Object.values(store.users).map((user) => withDefaults(user));
}

export async function appendWebhookLog(payload: Omit<WebhookLog, "id" | "receivedAt">) {
  return mutateStore((store) => {
    const log: WebhookLog = {
      ...payload,
      id: randomUUID(),
      receivedAt: new Date().toISOString(),
    };

    store.webhookLogs = [...store.webhookLogs, log].slice(-400);
    return log;
  });
}

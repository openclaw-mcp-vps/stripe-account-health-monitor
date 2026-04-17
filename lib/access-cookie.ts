import { createHmac, timingSafeEqual } from "node:crypto";

const ACCESS_COOKIE_NAME = "saam_access";
const DEFAULT_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;

function getCookieSecret() {
  return process.env.ACCESS_COOKIE_SECRET ?? process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "local-dev-secret";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(payload: string) {
  return createHmac("sha256", getCookieSecret()).update(payload, "utf8").digest("hex");
}

export function getAccessCookieName() {
  return ACCESS_COOKIE_NAME;
}

export function createAccessCookieValue(email: string, now = Date.now(), ttlSeconds = DEFAULT_COOKIE_TTL_SECONDS) {
  const expiresAt = now + ttlSeconds * 1000;
  const payload = `${email.toLowerCase()}:${expiresAt}`;
  const signature = signPayload(payload);
  return Buffer.from(`${payload}:${signature}`, "utf8").toString("base64url");
}

export function parseAndValidateAccessCookie(raw: string | undefined) {
  if (!raw) {
    return null;
  }

  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length < 3) {
      return null;
    }

    const signature = parts.pop();
    const expiresAtRaw = parts.pop();
    const email = parts.join(":").toLowerCase();

    if (!signature || !expiresAtRaw || !email) {
      return null;
    }

    const payload = `${email}:${expiresAtRaw}`;
    const expected = signPayload(payload);
    if (!safeEqual(expected, signature)) {
      return null;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      return null;
    }

    return {
      email,
      expiresAt,
    };
  } catch {
    return null;
  }
}


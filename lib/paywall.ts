import { createHmac, timingSafeEqual } from "node:crypto";

export const PAYWALL_COOKIE_NAME = "sahm_access";
const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 30;

interface PaywallPayload {
  email: string;
  exp: number;
}

function getSecret(): string {
  return process.env.PAYWALL_COOKIE_SECRET || "local-dev-insecure-secret";
}

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createPaywallToken(email: string, expiresInSeconds = DEFAULT_EXPIRY_SECONDS): string {
  const payload: PaywallPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds
  };

  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyPaywallToken(token: string | undefined): PaywallPayload | null {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = sign(payloadPart);
  const isValidSignature =
    expectedSignature.length === signaturePart.length &&
    timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signaturePart));

  if (!isValidSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64url(payloadPart)) as PaywallPayload;
    if (!parsed.email || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

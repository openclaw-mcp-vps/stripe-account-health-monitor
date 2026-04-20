import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getDefaultAlertSettings, readState, updateState } from "@/lib/db";
import type { AlertSettings } from "@/lib/types";

export const runtime = "nodejs";

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function parseNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildLemonCheckoutUrl(origin: string, email: string) {
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;

  if (!productId) {
    throw new Error("NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID is not configured.");
  }

  const url = new URL(`https://checkout.lemonsqueezy.com/buy/${productId}`);
  url.searchParams.set("embed", "1");
  url.searchParams.set("media", "0");
  url.searchParams.set("logo", "0");
  url.searchParams.set("checkout[email]", email);
  url.searchParams.set("checkout[custom][account_email]", email);
  url.searchParams.set("checkout[success_url]", `${origin}/?checkout=success`);

  return url.toString();
}

function buildAuthorizedCookie(response: NextResponse, email: string) {
  const secure = process.env.NODE_ENV === "production";
  const expiresInSeconds = 60 * 60 * 24 * 30;

  response.cookies.set({
    name: "shm_paid",
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: expiresInSeconds,
  });

  response.cookies.set({
    name: "shm_email",
    value: encodeURIComponent(email),
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: expiresInSeconds,
  });
}

async function parseActionPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }

  return {};
}

export async function GET() {
  const cookieStore = await cookies();
  const paid = cookieStore.get("shm_paid")?.value === "1";
  const state = await readState();

  return NextResponse.json({
    paid,
    settings: state.alertSettings,
    paidCustomerCount: state.paidCustomers.length,
  });
}

export async function POST(request: NextRequest) {
  const payload = await parseActionPayload(request);
  const action = String(payload.action ?? "");

  if (action === "checkout-link") {
    const email = normalizeEmail(String(payload.email ?? ""));
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid billing email." }, { status: 400 });
    }

    try {
      const checkoutUrl = buildLemonCheckoutUrl(request.nextUrl.origin, email);
      await updateState((current) => ({
        ...current,
        pendingCheckoutEmails: Array.from(new Set([...current.pendingCheckoutEmails, email])),
      }));

      return NextResponse.json({
        checkoutUrl,
        message:
          "Checkout started. After payment confirmation, return and unlock the dashboard using this same email.",
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not start checkout." },
        { status: 400 },
      );
    }
  }

  if (action === "unlock") {
    const email = normalizeEmail(String(payload.email ?? ""));

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Enter the email used during checkout." }, { status: 400 });
    }

    const state = await readState();
    const paidFromWebhook = state.paidCustomers.some((customer) => customer.email === email);
    const allowPendingUnlock = process.env.NODE_ENV !== "production";
    const pendingMatch = state.pendingCheckoutEmails.includes(email);

    if (!paidFromWebhook && !(allowPendingUnlock && pendingMatch)) {
      return NextResponse.json(
        {
          error:
            "No verified payment found for this email yet. Ensure your Lemon Squeezy webhook is configured, then retry.",
        },
        { status: 403 },
      );
    }

    const response = NextResponse.json({ message: "Access granted. Opening dashboard..." });
    buildAuthorizedCookie(response, email);
    return response;
  }

  if (action === "lock") {
    const response = NextResponse.json({ message: "Dashboard access removed for this browser." });
    response.cookies.delete("shm_paid");
    response.cookies.delete("shm_email");
    return response;
  }

  if (action === "update-settings") {
    const cookieStore = await cookies();
    const paid = cookieStore.get("shm_paid")?.value === "1";

    if (!paid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const incoming = (payload.settings as Partial<AlertSettings> | undefined) ?? {};
    const defaults = getDefaultAlertSettings();

    const nextSettings: AlertSettings = {
      email: {
        enabled: parseBoolean(incoming.email?.enabled),
        to: String(incoming.email?.to ?? "").trim(),
      },
      sms: {
        enabled: parseBoolean(incoming.sms?.enabled),
        to: String(incoming.sms?.to ?? "").trim(),
      },
      thresholds: {
        chargebackRate: parseNumber(
          incoming.thresholds?.chargebackRate,
          defaults.thresholds.chargebackRate,
        ),
        disputeSpike: parseNumber(incoming.thresholds?.disputeSpike, defaults.thresholds.disputeSpike),
        failedPayouts: parseNumber(
          incoming.thresholds?.failedPayouts,
          defaults.thresholds.failedPayouts,
        ),
        complianceFlags: parseNumber(
          incoming.thresholds?.complianceFlags,
          defaults.thresholds.complianceFlags,
        ),
      },
    };

    await updateState((current) => ({
      ...current,
      alertSettings: nextSettings,
    }));

    return NextResponse.json({ message: "Alert settings updated.", settings: nextSettings });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}

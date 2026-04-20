import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { readState, updateState } from "@/lib/db";
import { startMonitoringScheduler } from "@/lib/monitoring";
import { validateStripeKey } from "@/lib/stripe";
import type { StripeConnection } from "@/lib/types";

export const runtime = "nodejs";

async function requirePaidAccess() {
  const cookieStore = await cookies();
  return cookieStore.get("shm_paid")?.value === "1";
}

export async function GET() {
  const paid = await requirePaidAccess();

  if (!paid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await readState();
  const connection = state.stripeConnection
    ? {
        ...state.stripeConnection,
        apiKey: `${state.stripeConnection.apiKey.slice(0, 8)}…`,
      }
    : null;
  return NextResponse.json({ connection });
}

export async function POST(request: NextRequest) {
  const paid = await requirePaidAccess();

  if (!paid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { apiKey?: string };
    const apiKey = payload.apiKey?.trim();

    if (!apiKey) {
      return NextResponse.json({ error: "Stripe API key is required." }, { status: 400 });
    }

    if (!apiKey.startsWith("sk_")) {
      return NextResponse.json(
        { error: "Invalid Stripe key format. Expected a secret key starting with sk_." },
        { status: 400 },
      );
    }

    const account = await validateStripeKey(apiKey);

    const connection: StripeConnection = {
      apiKey,
      accountId: account.accountId,
      accountName: account.accountName,
      livemode: account.livemode,
      connectedAt: new Date().toISOString(),
    };

    await updateState((current) => ({
      ...current,
      stripeConnection: connection,
    }));

    startMonitoringScheduler();

    return NextResponse.json({
      message: `Connected to ${connection.accountName}.`,
      connection: {
        ...connection,
        apiKey: connection.apiKey.slice(0, 8) + "…",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not connect to Stripe. Check API key permissions and try again.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const paid = await requirePaidAccess();

  if (!paid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await updateState((current) => ({
    ...current,
    stripeConnection: null,
  }));

  return NextResponse.json({ message: "Stripe connection removed." });
}

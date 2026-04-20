import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/db";
import { runHealthCheckForUser, startMonitoringCron } from "@/lib/monitoring";
import { applyPaidCookie, applySessionCookie, hasPaidCookie, resolveUserId } from "@/lib/session";

const STALE_MINUTES = 30;

function isSnapshotStale(timestamp?: string) {
  if (!timestamp) return true;
  const ageMs = Date.now() - new Date(timestamp).getTime();
  return ageMs > STALE_MINUTES * 60_000;
}

async function handleMonitorRequest(request: NextRequest, forceRefresh: boolean) {
  startMonitoringCron();

  const { userId, isNew } = resolveUserId(request);
  const user = await getOrCreateUser(userId);

  if (!(hasPaidCookie(request) || user.paid)) {
    const denied = NextResponse.json({ error: "Subscription required." }, { status: 402 });
    if (isNew) applySessionCookie(denied, userId);
    return denied;
  }

  if (!user.stripeSecretKeyEncrypted) {
    const response = NextResponse.json({
      connected: false,
      history: user.history,
    });

    if (isNew) applySessionCookie(response, userId);
    applyPaidCookie(response);
    return response;
  }

  try {
    let snapshot = user.lastSnapshot;
    const needsRefresh = forceRefresh || isSnapshotStale(snapshot?.timestamp);

    if (needsRefresh) {
      const result = await runHealthCheckForUser(userId);
      snapshot = result.snapshot;
    }

    const freshUser = await getOrCreateUser(userId);

    const response = NextResponse.json({
      connected: true,
      accountLabel: freshUser.stripeDisplayName,
      snapshot: freshUser.lastSnapshot,
      history: freshUser.history,
    });

    if (isNew) applySessionCookie(response, userId);
    applyPaidCookie(response);

    return response;
  } catch (error) {
    console.error("Monitoring route failed", error);

    const response = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Monitoring run failed.",
      },
      { status: 500 },
    );

    if (isNew) applySessionCookie(response, userId);
    applyPaidCookie(response);
    return response;
  }
}

export async function GET(request: NextRequest) {
  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "1";
  return handleMonitorRequest(request, forceRefresh);
}

export async function POST(request: NextRequest) {
  return handleMonitorRequest(request, true);
}

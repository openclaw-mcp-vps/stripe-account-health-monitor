import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { runMonitoringCheck, startMonitoringScheduler } from "@/lib/monitoring";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest, paidCookie: string | undefined) {
  if (paidCookie === "1") {
    return true;
  }

  const token = request.headers.get("x-monitor-token");
  return Boolean(token && process.env.MONITOR_CRON_SECRET && token === process.env.MONITOR_CRON_SECRET);
}

async function executeMonitoring(request: NextRequest, trigger: string) {
  const cookieStore = await cookies();
  const paidCookie = cookieStore.get("shm_paid")?.value;

  if (!isAuthorized(request, paidCookie)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    startMonitoringScheduler();
    const run = await runMonitoringCheck(trigger);
    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Monitoring failed.",
      },
      { status: 400 },
    );
  }
}

export async function GET(request: NextRequest) {
  return executeMonitoring(request, "manual:get");
}

export async function POST(request: NextRequest) {
  return executeMonitoring(request, "manual:post");
}

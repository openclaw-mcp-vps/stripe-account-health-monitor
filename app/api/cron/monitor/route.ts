import { NextResponse } from "next/server";

import { runMonitoringCycle } from "@/lib/stripe-monitor";

export const runtime = "nodejs";

function authorizeCron(request: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    return true;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "");

  return headerSecret === configuredSecret || bearer === configuredSecret;
}

async function handle(request: Request, trigger: string): Promise<NextResponse> {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
  }

  try {
    const result = await runMonitoringCycle(trigger);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const manual = searchParams.get("manual") === "true";
  return handle(request, manual ? "manual_get" : "cron_get");
}

export async function POST(request: Request): Promise<NextResponse> {
  return handle(request, "cron_post");
}

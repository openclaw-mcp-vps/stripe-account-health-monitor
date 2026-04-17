import { NextResponse } from "next/server";

import { listOpenAlerts } from "@/lib/database";
import { buildHealthReport } from "@/lib/health-analyzer";
import { getStripeAccountSnapshot } from "@/lib/stripe-client";

export async function GET() {
  const snapshot = await getStripeAccountSnapshot();
  const report = buildHealthReport(snapshot);
  const alerts = await listOpenAlerts();

  return NextResponse.json({
    status: "ok",
    report,
    openAlerts: alerts,
  });
}

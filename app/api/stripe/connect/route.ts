import { NextResponse } from "next/server";

import { buildHealthReport } from "@/lib/health-analyzer";
import { getStripeAccountSnapshot } from "@/lib/stripe-client";

export async function GET() {
  try {
    const snapshot = await getStripeAccountSnapshot();
    const report = buildHealthReport(snapshot);

    return NextResponse.json({
      ok: true,
      account: snapshot,
      health: {
        score: report.score,
        level: report.level,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to connect to Stripe.",
      },
      { status: 500 }
    );
  }
}

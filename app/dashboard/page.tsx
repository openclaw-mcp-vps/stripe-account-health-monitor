import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HealthScore } from "@/components/HealthScore";
import { MetricsDashboard } from "@/components/MetricsDashboard";
import { RiskAlerts } from "@/components/RiskAlerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessCookieName, parseAndValidateAccessCookie } from "@/lib/access-cookie";
import { listRecentStripeEvents } from "@/lib/database";
import { buildHealthReport } from "@/lib/health-analyzer";
import { getStripeAccountSnapshot } from "@/lib/stripe-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(getAccessCookieName())?.value;
  const access = parseAndValidateAccessCookie(accessCookie);

  if (!access) {
    redirect("/");
  }

  const snapshot = await getStripeAccountSnapshot();
  const report = buildHealthReport(snapshot);
  const events = await listRecentStripeEvents();

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-6 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Stripe Health Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">
            Account {snapshot.accountId} · Last refresh {new Date(snapshot.lastRefreshedAt).toLocaleString("en-US")}
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </header>

      <HealthScore score={report.score} level={report.level} summary={report.summary} />
      <MetricsDashboard metrics={report.metrics} />

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <RiskAlerts risks={report.risks} />
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Webhook Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-slate-300">No webhook events captured yet. Send a test webhook from Stripe to validate your setup.</p>
            ) : (
              <ul className="space-y-3">
                {events.map((event) => (
                  <li key={event.id} className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-sm">
                    <p className="font-medium text-slate-100">{event.type}</p>
                    <p className="text-slate-400">{new Date(event.createdAt).toLocaleString("en-US")}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

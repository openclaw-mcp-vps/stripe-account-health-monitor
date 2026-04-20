import { cookies } from "next/headers";
import Link from "next/link";

import { AlertSettings } from "@/components/AlertSettings";
import { MetricsChart } from "@/components/MetricsChart";
import { RunMonitorButton } from "@/components/RunMonitorButton";
import { StripeConnect } from "@/components/StripeConnect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAlertSettings,
  getLatestMetricSnapshot,
  getStripeAccount,
  listAlertEvents,
  listMetricSnapshots
} from "@/lib/database";
import { PAYWALL_COOKIE_NAME, verifyPaywallToken } from "@/lib/paywall";

export const dynamic = "force-dynamic";

function asPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function riskVariant(level: string): "low" | "medium" | "high" | "critical" {
  if (level === "critical") {
    return "critical";
  }
  if (level === "high") {
    return "high";
  }
  if (level === "medium") {
    return "medium";
  }
  return "low";
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PAYWALL_COOKIE_NAME)?.value;
  const session = verifyPaywallToken(token);

  if (!session) {
    return (
      <main className="min-h-screen bg-[#0d1117] px-6 py-12 text-zinc-100 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard access is locked</CardTitle>
              <CardDescription>
                This monitoring dashboard is available after active subscription. Complete checkout and unlock
                access with your purchase email.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href="/">
                <Button>Go to pricing</Button>
              </Link>
              <Link href="/thank-you">
                <Button variant="secondary">I already purchased</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const [account, latestSnapshot, snapshots, alertSettings, alerts] = [
    getStripeAccount(),
    getLatestMetricSnapshot(),
    listMetricSnapshots(160),
    getAlertSettings(),
    listAlertEvents(30)
  ];

  return (
    <main className="min-h-screen bg-[#0d1117] px-6 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">Protected Dashboard</p>
            <h1 className="text-3xl font-semibold">Stripe Account Health</h1>
            <p className="mt-1 text-sm text-zinc-400">Signed in as {session.email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <RunMonitorButton />
            <Link href="/">
              <Button variant="ghost">Landing page</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Current risk level</CardDescription>
              <CardTitle>
                {latestSnapshot ? <Badge variant={riskVariant(latestSnapshot.riskLevel)}>{latestSnapshot.riskLevel}</Badge> : "No data"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-zinc-300">
              {latestSnapshot ? `${latestSnapshot.riskScore.toFixed(1)} / 100` : "Run your first monitor cycle."}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Chargeback rate</CardDescription>
              <CardTitle>{latestSnapshot ? asPercent(latestSnapshot.chargebackRate) : "-"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-zinc-300">Threshold: {asPercent(alertSettings.chargebackThreshold)}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Disputes (30d)</CardDescription>
              <CardTitle>{latestSnapshot ? latestSnapshot.disputeCount : "-"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-zinc-300">Threshold: {alertSettings.disputeThreshold}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Compliance flags</CardDescription>
              <CardTitle>{latestSnapshot ? latestSnapshot.complianceFlags : "-"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-zinc-300">Threshold: {alertSettings.complianceThreshold}</CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <StripeConnect existingAccount={account} />
          <AlertSettings initialSettings={alertSettings} />
        </section>

        <MetricsChart snapshots={snapshots} />

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Latest monitor interpretation</CardTitle>
              <CardDescription>Automated analysis from the most recent Stripe pull</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-300">
              {latestSnapshot ? (
                latestSnapshot.notes.map((note) => (
                  <p key={note} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
                    {note}
                  </p>
                ))
              ) : (
                <p>No snapshot yet. Connect Stripe and trigger a monitor cycle.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert activity</CardTitle>
              <CardDescription>Recent notifications and delivery/system events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-300">
              {alerts.length === 0 ? (
                <p>No alerts recorded yet.</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">
                      {new Date(alert.createdAt).toLocaleString()} • {alert.channel}
                    </p>
                    <p className="mt-1">{alert.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

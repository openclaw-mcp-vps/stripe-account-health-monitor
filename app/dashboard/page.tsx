import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AlertSettings } from "@/components/AlertSettings";
import { MetricCard } from "@/components/MetricCard";
import { RiskChart } from "@/components/RiskChart";
import { StripeConnect } from "@/components/StripeConnect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/monitoring";

function riskTone(level: "low" | "medium" | "high" | "critical"): "good" | "warning" | "danger" {
  if (level === "low") return "good";
  if (level === "medium") return "warning";
  return "danger";
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const isPaid = cookieStore.get("shm_paid")?.value === "1";

  if (!isPaid) {
    redirect("/?paywall=required");
  }

  const data = await getDashboardData();
  const latestRun = data.latestRun;
  const safeConnection = data.stripeConnection
    ? {
        ...data.stripeConnection,
        apiKey: `${data.stripeConnection.apiKey.slice(0, 8)}…`,
      }
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#58a6ff]">Paid Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold">Stripe Account Health Command Center</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#8b949e]">
            Monitor dispute pressure, chargeback trajectory, payout failures, and compliance requirements before account
            restrictions hit live revenue.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-md border border-[#2f3b4a] px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#21262d]"
          >
            Back to Site
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Risk Score"
          value={latestRun ? `${latestRun.risk.score}/100` : "--"}
          caption={latestRun ? `Current level: ${latestRun.risk.level}` : "Run your first health check"}
          tone={latestRun ? riskTone(latestRun.risk.level) : "warning"}
          trend={latestRun && latestRun.risk.level !== "low" ? "up" : "neutral"}
        />
        <MetricCard
          title="Chargeback Rate"
          value={latestRun ? `${latestRun.metrics.chargebackRate}%` : "--"}
          caption="Threshold default: 0.75%"
          tone={
            latestRun
              ? latestRun.metrics.chargebackRate > data.alertSettings.thresholds.chargebackRate
                ? "danger"
                : "good"
              : "warning"
          }
          trend={latestRun && latestRun.metrics.chargebackRate > 0.75 ? "up" : "neutral"}
        />
        <MetricCard
          title="Open Disputes"
          value={latestRun ? `${latestRun.metrics.openDisputes}` : "--"}
          caption="Unresolved disputes in lookback window"
          tone={
            latestRun
              ? latestRun.metrics.openDisputes >= data.alertSettings.thresholds.disputeSpike
                ? "danger"
                : "good"
              : "warning"
          }
          trend={latestRun && latestRun.metrics.openDisputes > 0 ? "up" : "neutral"}
        />
        <MetricCard
          title="Compliance Flags"
          value={latestRun ? `${latestRun.metrics.complianceFlags}` : "--"}
          caption="Outstanding Stripe requirements"
          tone={
            latestRun
              ? latestRun.metrics.complianceFlags >= data.alertSettings.thresholds.complianceFlags
                ? "danger"
                : "good"
              : "warning"
          }
          trend={latestRun && latestRun.metrics.complianceFlags > 0 ? "up" : "neutral"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="space-y-6">
          <StripeConnect initialConnection={safeConnection} />
          <AlertSettings initialSettings={data.alertSettings} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Dispute & Refund Pattern</CardTitle>
              <CardDescription>
                Spot sudden shifts in disputes or refunds that often precede Stripe account intervention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskChart data={latestRun?.metrics.timeline ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {latestRun ? (
                <>
                  <div>
                    <p className="font-medium text-[#c9d1d9]">Why this score was triggered</p>
                    <ul className="mt-2 space-y-2 text-[#8b949e]">
                      {latestRun.risk.reasons.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-[#c9d1d9]">Recommended next actions</p>
                    <ul className="mt-2 space-y-2 text-[#8b949e]">
                      {latestRun.risk.recommendations.map((recommendation) => (
                        <li key={recommendation}>• {recommendation}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-[#2f3b4a] bg-[#0d1117]/70 p-3 text-xs text-[#8b949e]">
                    Last run: {new Date(latestRun.createdAt).toLocaleString()} · Trigger: {latestRun.trigger}
                  </div>
                </>
              ) : (
                <p className="text-[#8b949e]">
                  Connect Stripe and run your first check. You will immediately see score drivers and remediation steps.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

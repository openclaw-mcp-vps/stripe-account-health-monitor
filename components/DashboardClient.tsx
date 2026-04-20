"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  Gauge,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { AlertSettings as AlertSettingsType, HealthSnapshot } from "@/lib/types";
import { AlertSettings } from "@/components/AlertSettings";
import { MetricsCard } from "@/components/MetricsCard";
import { RiskTrendChart } from "@/components/RiskTrendChart";
import { StripeConnect } from "@/components/StripeConnect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

interface MonitorPayload {
  connected: boolean;
  accountLabel?: string;
  snapshot?: HealthSnapshot;
  history: HealthSnapshot[];
}

interface AlertPayload {
  settings: AlertSettingsType;
  readiness: {
    smtpReady: boolean;
    twilioReady: boolean;
  };
}

interface DashboardClientProps {
  initialConnectedAccount?: string;
}

export function DashboardClient({ initialConnectedAccount }: DashboardClientProps) {
  const [monitorData, setMonitorData] = useState<MonitorPayload | null>(null);
  const [alertData, setAlertData] = useState<AlertPayload | null>(null);
  const [accountName, setAccountName] = useState(initialConnectedAccount || "");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const monitorUrl = forceRefresh ? "/api/monitor?refresh=1" : "/api/monitor";
      const [monitorResponse, alertResponse] = await Promise.all([
        fetch(monitorUrl),
        fetch("/api/alerts"),
      ]);

      const monitorPayload = (await monitorResponse.json()) as MonitorPayload & { error?: string };
      const alertPayload = (await alertResponse.json()) as AlertPayload & { error?: string };

      if (!monitorResponse.ok) {
        throw new Error(monitorPayload.error || "Unable to fetch monitoring data.");
      }

      if (!alertResponse.ok) {
        throw new Error(alertPayload.error || "Unable to fetch alert settings.");
      }

      setMonitorData(monitorPayload);
      setAlertData(alertPayload);

      if (monitorPayload.accountLabel) {
        setAccountName(monitorPayload.accountLabel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected dashboard error.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(false).catch((err) => {
      setError(err instanceof Error ? err.message : "Unexpected dashboard error.");
      setLoading(false);
    });
  }, [fetchAll]);

  const snapshot = monitorData?.snapshot;

  const notes = useMemo(() => {
    if (!snapshot?.notes?.length) {
      return ["No immediate risk markers detected across the latest Stripe snapshot."];
    }

    return snapshot.notes;
  }, [snapshot]);

  const riskTone = snapshot
    ? snapshot.riskScore >= 80
      ? "danger"
      : snapshot.riskScore >= 60
        ? "warn"
        : "good"
    : "neutral";

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[#9aa4b2]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading dashboard
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-[#5a2230] bg-[#2a141b] px-4 py-3 text-sm text-[#ff8b9a]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stripe Risk Operations</h1>
          <p className="text-sm text-[#9aa4b2]">
            Continuous monitoring for disputes, chargebacks, and compliance indicators.
          </p>
        </div>
        <Button variant="secondary" onClick={() => fetchAll(true)} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Refreshing
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" /> Run Risk Check
            </>
          )}
        </Button>
      </div>

      <StripeConnect
        connectedAccount={accountName}
        onConnected={(name) => {
          setAccountName(name);
          fetchAll(true).catch(() => undefined);
        }}
      />

      {monitorData?.connected && snapshot ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricsCard
              title="Risk Score"
              value={`${snapshot.riskScore}/100`}
              hint={`Current level: ${snapshot.riskLevel}`}
              icon={ShieldAlert}
              tone={riskTone}
            />
            <MetricsCard
              title="Chargeback Rate"
              value={formatPercent(snapshot.chargebackRate)}
              hint={`${snapshot.disputesLast30Days} disputes / ${snapshot.successfulChargesLast30Days} paid charges`}
              icon={Gauge}
              tone={snapshot.chargebackRate >= 0.009 ? "danger" : "good"}
            />
            <MetricsCard
              title="Refund Rate"
              value={formatPercent(snapshot.refundRate30d)}
              hint="30-day refund pressure"
              icon={Wallet}
              tone={snapshot.refundRate30d >= 0.12 ? "warn" : "good"}
            />
            <MetricsCard
              title="Failed Payments (7d)"
              value={formatPercent(snapshot.failedPaymentRate7d)}
              hint="Intent failures and retries"
              icon={Activity}
              tone={snapshot.failedPaymentRate7d >= 0.12 ? "warn" : "neutral"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Risk Trend</CardTitle>
                <CardDescription>
                  Track account stability over time and verify that mitigation work is lowering risk.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RiskTrendChart history={monitorData.history} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-[#f7b955]" /> Active Risk Notes
                </CardTitle>
                <CardDescription>Actionable factors from the latest Stripe snapshot.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-[#d0d7de]">
                  {notes.map((note) => (
                    <li key={note} className="rounded-md border border-[#2a3444] bg-[#0f172a]/60 px-3 py-2">
                      {note}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Connect Stripe to activate monitoring</CardTitle>
            <CardDescription>
              As soon as a key is connected, the system will compute a baseline risk snapshot and begin
              scheduled monitoring every 30 minutes.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {alertData ? (
        <AlertSettings
          initialSettings={alertData.settings}
          deliveryReadiness={alertData.readiness}
          onSaved={(settings) => {
            setAlertData((prev) => (prev ? { ...prev, settings } : prev));
          }}
        />
      ) : null}
    </div>
  );
}

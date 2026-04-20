"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AlertSettings as AlertSettingsType } from "@/lib/types";

interface AlertSettingsProps {
  initialSettings: AlertSettingsType;
}

export function AlertSettings({ initialSettings }: AlertSettingsProps) {
  const [settings, setSettings] = useState<AlertSettingsType>(initialSettings);
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const update = (
    path: "email.enabled" | "sms.enabled" | "email.to" | "sms.to",
    value: string | boolean,
  ) => {
    setSettings((current) => {
      const next = structuredClone(current);
      if (path === "email.enabled") next.email.enabled = Boolean(value);
      if (path === "sms.enabled") next.sms.enabled = Boolean(value);
      if (path === "email.to") next.email.to = String(value);
      if (path === "sms.to") next.sms.to = String(value);
      return next;
    });
  };

  const updateThreshold = (
    key: keyof AlertSettingsType["thresholds"],
    value: number,
  ) => {
    setSettings((current) => ({
      ...current,
      thresholds: {
        ...current.thresholds,
        [key]: Number.isFinite(value) ? value : 0,
      },
    }));
  };

  const onSave = () => {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-settings",
          settings,
        }),
      });

      const body = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setMessage(body.error ?? "Failed to save alert settings.");
        return;
      }

      setMessage(body.message ?? "Alert settings saved.");
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Configuration</CardTitle>
        <CardDescription>
          Configure where risk alerts should be sent and tune thresholds to your tolerance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-[#2f3b4a] bg-[#0d1117]/60 p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-enabled">Email alerts</Label>
              <input
                id="email-enabled"
                type="checkbox"
                checked={settings.email.enabled}
                onChange={(event) => update("email.enabled", event.target.checked)}
                className="h-4 w-4 accent-[#3fb950]"
              />
            </div>
            <Input
              placeholder="ops@yourcompany.com"
              value={settings.email.to}
              onChange={(event) => update("email.to", event.target.value)}
            />
          </div>

          <div className="space-y-2 rounded-lg border border-[#2f3b4a] bg-[#0d1117]/60 p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-enabled">SMS alerts</Label>
              <input
                id="sms-enabled"
                type="checkbox"
                checked={settings.sms.enabled}
                onChange={(event) => update("sms.enabled", event.target.checked)}
                className="h-4 w-4 accent-[#58a6ff]"
              />
            </div>
            <Input
              placeholder="+14155551234"
              value={settings.sms.to}
              onChange={(event) => update("sms.to", event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chargeback-threshold">Chargeback rate threshold (%)</Label>
            <Input
              id="chargeback-threshold"
              type="number"
              step="0.01"
              value={settings.thresholds.chargebackRate}
              onChange={(event) =>
                updateThreshold("chargebackRate", Number(event.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispute-spike">Open dispute spike threshold</Label>
            <Input
              id="dispute-spike"
              type="number"
              value={settings.thresholds.disputeSpike}
              onChange={(event) => updateThreshold("disputeSpike", Number(event.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="failed-payouts">Failed payout threshold</Label>
            <Input
              id="failed-payouts"
              type="number"
              value={settings.thresholds.failedPayouts}
              onChange={(event) => updateThreshold("failedPayouts", Number(event.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="compliance-flags">Compliance flag threshold</Label>
            <Input
              id="compliance-flags"
              type="number"
              value={settings.thresholds.complianceFlags}
              onChange={(event) => updateThreshold("complianceFlags", Number(event.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Alert Settings"}
          </Button>
          {message ? <span className="text-sm text-[#8b949e]">{message}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

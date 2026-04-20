"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AlertSettings as AlertSettingsType } from "@/types/stripe-metrics";

interface AlertSettingsProps {
  initialSettings: AlertSettingsType;
}

function thresholdToPercent(value: number): string {
  return (value * 100).toFixed(2);
}

export function AlertSettings({ initialSettings }: AlertSettingsProps): React.JSX.Element {
  const [settings, setSettings] = useState<AlertSettingsType>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    setError(null);

    try {
      const payload = {
        emailEnabled: settings.emailEnabled,
        smsEnabled: settings.smsEnabled,
        chargebackThreshold: settings.chargebackThreshold,
        disputeThreshold: settings.disputeThreshold,
        complianceThreshold: settings.complianceThreshold,
        riskScoreThreshold: settings.riskScoreThreshold
      };

      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { settings?: AlertSettingsType; error?: string };
      if (!response.ok || !data.settings) {
        throw new Error(data.error || "Failed to update alert settings");
      }

      setSettings(data.settings);
      setStatusMessage("Alert settings saved. Future monitor runs will use these thresholds.");
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Settings</CardTitle>
        <CardDescription>
          Configure thresholds for email and SMS notifications before Stripe account risk escalates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSave}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-sm">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, emailEnabled: event.target.checked }))
                }
              />
              Email alerts
            </label>
            <label className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-sm">
              <input
                type="checkbox"
                checked={settings.smsEnabled}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, smsEnabled: event.target.checked }))
                }
              />
              SMS alerts
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="chargebackThreshold">Chargeback threshold (%)</Label>
              <Input
                id="chargebackThreshold"
                type="number"
                min={0.1}
                max={10}
                step={0.01}
                value={thresholdToPercent(settings.chargebackThreshold)}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    chargebackThreshold: Number(event.target.value || "0") / 100
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disputeThreshold">Disputes in rolling 30d</Label>
              <Input
                id="disputeThreshold"
                type="number"
                min={1}
                max={100}
                step={1}
                value={settings.disputeThreshold}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    disputeThreshold: Number(event.target.value || "1")
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="complianceThreshold">Compliance flags threshold</Label>
              <Input
                id="complianceThreshold"
                type="number"
                min={0}
                max={20}
                step={1}
                value={settings.complianceThreshold}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    complianceThreshold: Number(event.target.value || "0")
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskScoreThreshold">Risk score threshold</Label>
              <Input
                id="riskScoreThreshold"
                type="number"
                min={1}
                max={100}
                step={1}
                value={settings.riskScoreThreshold}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    riskScoreThreshold: Number(event.target.value || "1")
                  }))
                }
              />
            </div>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Alert Settings"}
          </Button>

          {statusMessage ? <p className="text-sm text-emerald-400">{statusMessage}</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

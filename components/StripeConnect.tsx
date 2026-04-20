"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, KeyRound, LoaderCircle, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MonitoringRun, StripeConnection } from "@/lib/types";

interface StripeConnectProps {
  initialConnection: StripeConnection | null;
  onRunComplete?: (run: MonitoringRun) => void;
}

export function StripeConnect({ initialConnection, onRunComplete }: StripeConnectProps) {
  const [apiKey, setApiKey] = useState("");
  const [connection, setConnection] = useState<StripeConnection | null>(initialConnection);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const connectStripe = () => {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const body = (await response.json()) as {
        connection?: StripeConnection;
        error?: string;
        message?: string;
      };

      if (!response.ok || !body.connection) {
        setMessage(body.error ?? "Failed to connect Stripe.");
        return;
      }

      setConnection(body.connection);
      setApiKey("");
      setMessage(body.message ?? "Stripe account connected.");
    });
  };

  const disconnectStripe = () => {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/stripe/connect", {
        method: "DELETE",
      });

      const body = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setMessage(body.error ?? "Failed to disconnect Stripe.");
        return;
      }

      setConnection(null);
      setMessage(body.message ?? "Stripe account disconnected.");
    });
  };

  const runCheck = () => {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/monitor", {
        method: "POST",
      });

      const body = (await response.json()) as {
        run?: MonitoringRun;
        error?: string;
      };

      if (!response.ok || !body.run) {
        setMessage(body.error ?? "Unable to run monitoring check.");
        return;
      }

      onRunComplete?.(body.run);
      setMessage(`Monitoring completed. Risk score ${body.run.risk.score}/100.`);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="h-5 w-5 text-[#58a6ff]" />
          Stripe Connection
        </CardTitle>
        <CardDescription>
          Use a restricted Stripe secret key with read access to charges, disputes, payouts, and account data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection ? (
          <div className="rounded-lg border border-[#1f6feb]/40 bg-[#0d1117]/70 p-4 text-sm">
            <p className="font-medium text-[#e6edf3]">Connected to {connection.accountName}</p>
            <p className="mt-1 text-[#8b949e]">Account ID: {connection.accountId}</p>
            <p className="text-[#8b949e]">
              Mode: {connection.livemode ? "Live" : "Test"} · Connected {new Date(connection.connectedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="stripe-key">Stripe Secret Key</Label>
            <Input
              id="stripe-key"
              type="password"
              autoComplete="off"
              placeholder="sk_live_..."
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <p className="text-xs text-[#8b949e]">
              Recommended: create a restricted key with read-only permissions for risk monitoring.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!connection ? (
            <Button onClick={connectStripe} disabled={isPending || !apiKey}>
              {isPending ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Connect Stripe
            </Button>
          ) : (
            <>
              <Button onClick={runCheck} disabled={isPending}>
                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run Health Check Now
              </Button>
              <Button variant="secondary" onClick={disconnectStripe} disabled={isPending}>
                Disconnect
              </Button>
            </>
          )}
        </div>

        {message ? (
          <p className="flex items-center gap-2 text-sm text-[#8b949e]">
            {message.toLowerCase().includes("failed") || message.toLowerCase().includes("unable") ? (
              <AlertCircle className="h-4 w-4 text-[#f85149]" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#3fb950]" />
            )}
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

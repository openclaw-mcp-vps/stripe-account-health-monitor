"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StripeConnectProps {
  connectedAccount?: string;
  onConnected: (accountName: string) => void;
}

export function StripeConnect({ connectedAccount, onConnected }: StripeConnectProps) {
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secretKey }),
      });

      const payload = (await response.json()) as {
        error?: string;
        account?: { displayName: string };
      };

      if (!response.ok || !payload.account) {
        throw new Error(payload.error || "Failed to connect to Stripe.");
      }

      setSecretKey("");
      onConnected(payload.account.displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#e6edf3]">
          <CheckCircle2 className="h-5 w-5 text-[#23c29a]" /> Stripe Connection
        </CardTitle>
        <CardDescription>
          Connect a restricted Stripe secret key to start pulling risk metrics every 30 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectedAccount ? (
          <div className="rounded-lg border border-[#1f6f59] bg-[#07241d] px-3 py-2 text-sm text-[#a7f3d0]">
            Connected account: <span className="font-semibold">{connectedAccount}</span>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="stripe-secret-key">Stripe Secret Key</Label>
          <Input
            id="stripe-secret-key"
            type="password"
            placeholder="sk_live_..."
            value={secretKey}
            onChange={(event) => setSecretKey(event.target.value)}
          />
          <p className="text-xs text-[#7d8590]">
            Recommended: create a restricted key with read access to Accounts, Charges, Disputes, and
            PaymentIntents.
          </p>
        </div>

        {error ? (
          <p className="flex items-center gap-2 text-sm text-[#ff8b9a]">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        ) : null}

        <Button onClick={handleConnect} disabled={!secretKey || loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying key
            </>
          ) : (
            "Connect Stripe"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

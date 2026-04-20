"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StripeAccountConnection } from "@/types/stripe-metrics";

interface StripeConnectProps {
  existingAccount: StripeAccountConnection | null;
}

export function StripeConnect({ existingAccount }: StripeConnectProps): React.JSX.Element {
  const [accountId, setAccountId] = useState(existingAccount?.accountId ?? "self");
  const [operatorEmail, setOperatorEmail] = useState(existingAccount?.operatorEmail ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accountId: accountId.trim() || "self",
          operatorEmail: operatorEmail.trim() || null
        })
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect Stripe account");
      }

      setStatus(data.message || "Stripe account connected");
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Connection</CardTitle>
        <CardDescription>
          Connect the Stripe account to monitor. Use <code>self</code> for your primary account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleConnect}>
          <div className="space-y-2">
            <Label htmlFor="accountId">Stripe account ID</Label>
            <Input
              id="accountId"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              placeholder="acct_123... or self"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operatorEmail">Alert owner email (optional)</Label>
            <Input
              id="operatorEmail"
              type="email"
              value={operatorEmail}
              onChange={(event) => setOperatorEmail(event.target.value)}
              placeholder="ops@yourcompany.com"
            />
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Verifying Stripe..." : "Save Stripe Connection"}
          </Button>

          {status ? <p className="text-sm text-emerald-400">{status}</p> : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

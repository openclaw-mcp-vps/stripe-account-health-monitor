"use client";

import Script from "next/script";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}

interface PricingCheckoutProps {
  alreadyPaid: boolean;
  highlighted?: boolean;
}

export function PricingCheckout({ alreadyPaid, highlighted = false }: PricingCheckoutProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"checkout" | "unlock" | null>(null);
  const [message, setMessage] = useState("");

  const handleCheckout = async () => {
    setLoading("checkout");
    setMessage("");

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkout-link",
          email,
        }),
      });

      const body = (await response.json()) as { checkoutUrl?: string; error?: string; message?: string };

      if (!response.ok || !body.checkoutUrl) {
        setMessage(body.error ?? "Could not initialize checkout.");
        return;
      }

      if (typeof window !== "undefined" && window.LemonSqueezy?.Url?.Open) {
        window.LemonSqueezy.Url.Open(body.checkoutUrl);
      } else {
        window.location.href = body.checkoutUrl;
      }

      setMessage(
        body.message ??
          "Checkout opened. After payment, return here and click Unlock with the same billing email.",
      );
    } catch {
      setMessage("Could not connect to checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleUnlock = async () => {
    setLoading("unlock");
    setMessage("");

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unlock",
          email,
        }),
      });

      const body = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setMessage(body.error ?? "Unlock failed. Make sure you used the same checkout email.");
        return;
      }

      setMessage(body.message ?? "Access granted. Redirecting to dashboard...");
      window.location.href = "/dashboard";
    } catch {
      setMessage("Could not unlock right now. Please retry in a few seconds.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-6 shadow-xl ${
        highlighted
          ? "border-[#1f6feb]/60 bg-[#111a27]"
          : "border-[#2f3b4a] bg-[#161b22]/80"
      }`}
    >
      <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />

      <p className="font-mono text-sm text-[#58a6ff]">$15/month</p>
      <h3 className="mt-2 text-2xl font-semibold">Protect Payment Infrastructure Before Revenue Is At Risk</h3>
      <p className="mt-3 text-sm text-[#8b949e]">
        Continuous Stripe risk monitoring, instant dispute/compliance alerts, and a dashboard your ops team can act on.
      </p>

      <div className="mt-5 space-y-3">
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="founder@company.com"
        />
        <Button onClick={handleCheckout} disabled={loading !== null || !email} className="w-full">
          {loading === "checkout" ? "Opening Checkout..." : "Start Monitoring With Lemon Squeezy"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleUnlock}
          disabled={loading !== null || !email}
          className="w-full"
        >
          {loading === "unlock" ? "Verifying..." : alreadyPaid ? "Go To Dashboard" : "I Already Paid, Unlock Dashboard"}
        </Button>
      </div>

      <ul className="mt-5 space-y-2 text-sm text-[#c9d1d9]">
        <li>24/7 account monitoring and risk scoring</li>
        <li>Email + SMS escalation for critical changes</li>
        <li>Stripe webhook support for near real-time updates</li>
      </ul>

      {message ? <p className="mt-4 text-sm text-[#8b949e]">{message}</p> : null}
    </div>
  );
}

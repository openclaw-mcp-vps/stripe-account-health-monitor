"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccessGateForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUnlock() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/access/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { ok: boolean; message: string };
      setMessage(payload.message);

      if (payload.ok) {
        window.location.href = "/dashboard";
      }
    } catch {
      setMessage("Unable to verify purchase right now. Please retry in a minute.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
      <p className="text-sm text-slate-200">Already purchased? Enter the checkout email to unlock your dashboard.</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="billing@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-600 bg-slate-950 px-3 text-sm text-slate-100 outline-none ring-emerald-500 focus:ring"
        />
        <Button type="button" onClick={handleUnlock} disabled={loading || email.length < 5}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
        </Button>
      </div>
      {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}

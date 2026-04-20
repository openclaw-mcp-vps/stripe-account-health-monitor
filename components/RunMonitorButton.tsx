"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function RunMonitorButton(): React.JSX.Element {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun(): Promise<void> {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/cron/monitor?manual=true", {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Manual monitor run failed");
      }

      window.location.reload();
    } catch (requestError) {
      setError((requestError as Error).message);
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="secondary" onClick={handleRun} disabled={isRunning}>
        {isRunning ? "Running monitor..." : "Run monitor now"}
      </Button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

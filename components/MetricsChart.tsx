"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StripeHealthSnapshot } from "@/types/stripe-metrics";

interface MetricsChartProps {
  snapshots: StripeHealthSnapshot[];
}

function percent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function MetricsChart({ snapshots }: MetricsChartProps): React.JSX.Element {
  const chartData = snapshots.map((snapshot) => ({
    timestamp: new Date(snapshot.capturedAt).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    riskScore: Number(snapshot.riskScore.toFixed(1)),
    chargebackRate: Number((snapshot.chargebackRate * 100).toFixed(2)),
    paymentFailureRate: Number((snapshot.paymentFailureRate * 100).toFixed(2))
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>30-Day Risk Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#262c36" strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" minTickGap={34} stroke="#8b949e" />
              <YAxis yAxisId="risk" stroke="#8b949e" domain={[0, 100]} />
              <YAxis yAxisId="pct" orientation="right" stroke="#8b949e" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #1f2937",
                  borderRadius: "8px"
                }}
                formatter={(rawValue, rawName) => {
                  const value =
                    typeof rawValue === "number"
                      ? rawValue
                      : Number(Array.isArray(rawValue) ? rawValue[0] : rawValue ?? 0);
                  const name = String(rawName ?? "");

                  if (name === "riskScore") {
                    return [value.toFixed(1), "Risk score"];
                  }

                  if (name === "chargebackRate") {
                    return [percent(value / 100), "Chargeback rate"];
                  }

                  return [percent(value / 100), "Payment failure rate"];
                }}
              />
              <Legend />
              <Line
                yAxisId="risk"
                type="monotone"
                dataKey="riskScore"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                name="Risk score"
              />
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="chargebackRate"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                name="Chargeback %"
              />
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="paymentFailureRate"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                name="Payment failure %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

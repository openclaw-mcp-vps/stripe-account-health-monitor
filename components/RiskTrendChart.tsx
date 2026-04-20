"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { HealthSnapshot } from "@/lib/types";

interface RiskTrendChartProps {
  history: HealthSnapshot[];
}

function formatTimeLabel(timestamp: string) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function RiskTrendChart({ history }: RiskTrendChartProps) {
  const chartData = history.map((point) => ({
    label: formatTimeLabel(point.timestamp),
    riskScore: point.riskScore,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 16, left: -12, bottom: 4 }}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fill: "#9aa4b2", fontSize: 12 }} />
          <YAxis tick={{ fill: "#9aa4b2", fontSize: 12 }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#e6edf3",
            }}
          />
          <Line
            type="monotone"
            dataKey="riskScore"
            stroke="#23c29a"
            strokeWidth={3}
            dot={{ r: 2, fill: "#23c29a" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

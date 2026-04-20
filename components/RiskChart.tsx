"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RiskChartProps {
  data: Array<{ label: string; disputes: number; refunds: number }>;
}

export function RiskChart({ data }: RiskChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#2f3b4a" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="#8b949e" />
          <YAxis stroke="#8b949e" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#161b22",
              borderColor: "#30363d",
              borderRadius: 10,
            }}
            labelStyle={{ color: "#e6edf3" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="disputes"
            stroke="#f85149"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#f85149" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="refunds"
            stroke="#58a6ff"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#58a6ff" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

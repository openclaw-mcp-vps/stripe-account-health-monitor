import { AlertTriangle, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  caption: string;
  trend?: "up" | "down" | "neutral";
  tone?: "good" | "warning" | "danger";
}

export function MetricCard({
  title,
  value,
  caption,
  trend = "neutral",
  tone = "good",
}: MetricCardProps) {
  const toneColor =
    tone === "good" ? "text-[#3fb950]" : tone === "warning" ? "text-[#d29922]" : "text-[#f85149]";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-1 text-3xl font-semibold">{value}</CardTitle>
        </div>
        <span className={toneColor}>
          {tone === "good" && <ShieldCheck className="h-5 w-5" />}
          {tone === "warning" && <AlertTriangle className="h-5 w-5" />}
          {tone === "danger" && <AlertTriangle className="h-5 w-5" />}
        </span>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="flex items-center gap-2 text-xs text-[#8b949e]">
          {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-[#f85149]" />}
          {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-[#3fb950]" />}
          {caption}
        </p>
      </CardContent>
    </Card>
  );
}

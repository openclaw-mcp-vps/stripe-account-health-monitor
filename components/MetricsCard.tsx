import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsCardProps {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "neutral" | "good" | "warn" | "danger";
}

export function MetricsCard({ title, value, hint, icon: Icon, tone = "neutral" }: MetricsCardProps) {
  const toneClass = {
    neutral: "text-[#9aa4b2]",
    good: "text-[#23c29a]",
    warn: "text-[#f7b955]",
    danger: "text-[#ff6478]",
  }[tone];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[#9aa4b2]">{title}</CardTitle>
        <Icon className="h-4 w-4 text-[#4fb8ff]" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className={`mt-1 text-xs ${toneClass}`}>{hint}</p>
      </CardContent>
    </Card>
  );
}

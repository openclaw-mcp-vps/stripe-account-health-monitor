import { ShieldAlert, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface HealthScoreProps {
  score: number;
  level: "excellent" | "stable" | "watch" | "critical";
  summary: string;
}

export function HealthScore({ score, level, summary }: HealthScoreProps) {
  const isHealthy = level === "excellent" || level === "stable";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Account Health Score</CardTitle>
          <Badge variant={level === "critical" ? "destructive" : level === "watch" ? "warning" : "default"}>
            {level.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>Updated in real time using Stripe account and requirement signals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          {isHealthy ? <ShieldCheck className="h-6 w-6 text-emerald-400" /> : <ShieldAlert className="h-6 w-6 text-rose-400" />}
          <p className="text-4xl font-bold">{score}</p>
          <p className="text-sm text-slate-400">out of 100</p>
        </div>
        <Progress value={score} />
        <p className="text-sm text-slate-300">{summary}</p>
      </CardContent>
    </Card>
  );
}

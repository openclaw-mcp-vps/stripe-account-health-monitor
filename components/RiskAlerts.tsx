import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RiskAlertsProps {
  risks: {
    level: "low" | "medium" | "high";
    title: string;
    message: string;
    action: string;
  }[];
}

export function RiskAlerts({ risks }: RiskAlertsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Risk Alerts</CardTitle>
        <CardDescription>Actionable signals tied to potential account limitations or deactivation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {risks.length === 0 ? (
          <p className="text-sm text-slate-300">No active risks detected. Maintain weekly checks to stay ahead.</p>
        ) : (
          risks.map((risk) => (
            <div key={risk.title} className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <p className="font-medium">{risk.title}</p>
                <Badge variant={risk.level === "high" ? "destructive" : risk.level === "medium" ? "warning" : "outline"}>
                  {risk.level}
                </Badge>
              </div>
              <p className="text-sm text-slate-300">{risk.message}</p>
              <p className="mt-2 text-sm text-emerald-300">Recommended: {risk.action}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

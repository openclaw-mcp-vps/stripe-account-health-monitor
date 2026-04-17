import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsDashboardProps {
  metrics: {
    id: string;
    label: string;
    value: string;
    hint: string;
  }[];
}

export function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{metric.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-400">{metric.hint}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

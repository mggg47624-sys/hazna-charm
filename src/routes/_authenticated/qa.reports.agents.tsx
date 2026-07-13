import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ReportTable } from "@/components/report-table";
import { SectionGuard } from "@/components/section-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/qa/reports/agents")({
  component: AgentsReport,
});

function AgentsReport() {
  const { data } = useQuery({ queryKey: ["reports", "agentsPerf"], queryFn: () => api<any[]>("/api/Report/Agents") });
  const rows = data || [];
  const chart = rows.map((r) => ({
    name: r.agentName || "—",
    calls: Number(r.totalCalls ?? 0),
    answered: Number(r.answeredCalls ?? 0),
  }));
  return (
    <SectionGuard section="qa:reports"><div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">QA Agents Performance</h1>
        <p className="text-sm text-muted-foreground">Call volume per agent</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Calls vs Answered</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="calls" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="answered" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <ReportTable
        queryKey={["reports", "agentsPerf"]}
        endpoint="/api/Report/Agents"
        filename="agents-performance.csv"
        searchPlaceholder="Search agents..."
        columns={[
          { key: "agentName", header: "Agent", accessor: (r: any) => r.agentName || "—" },
          { key: "totalCalls", header: "Total Calls", accessor: (r: any) => r.totalCalls ?? 0 },
          { key: "answered", header: "Answered", accessor: (r: any) => r.answeredCalls ?? 0 },
          { key: "noAnswer", header: "No Answer", accessor: (r: any) => r.noAnswerCalls ?? 0 },
          { key: "callLater", header: "Call Later", accessor: (r: any) => r.callLaterCalls ?? 0 },
          { key: "totalEvaluations", header: "Total Evaluations", accessor: (r: any) => r.totalEvaluations ?? 0 },
          { key: "avgScoreGiven", header: "Avg Score Given", accessor: (r: any) => Number(r.avgScoreGiven ?? 0).toFixed(2) },
        ]}
      />
    </div></SectionGuard>
  );
}

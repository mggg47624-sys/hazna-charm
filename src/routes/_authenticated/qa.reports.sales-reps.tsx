import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ReportTable } from "@/components/report-table";
import { SectionGuard } from "@/components/section-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


export const Route = createFileRoute("/_authenticated/qa/reports/sales-reps")({
  component: SalesRepsReport,
});

function SalesRepsReport() {
  const { data } = useQuery({ queryKey: ["reports", "salesRepsPerf"], queryFn: () => api<any[]>("/api/Report/SalesReps") });
  const rows = data || [];

  const [tl, setTl] = useState("all");
  const [minEvals, setMinEvals] = useState("");

  const tls = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.teamLeaderName && set.add(r.teamLeaderName));
    return Array.from(set).sort();
  }, [rows]);

  const clientFilter = useMemo(
    () => (r: any) => {
      if (tl !== "all" && r.teamLeaderName !== tl) return false;
      if (minEvals && Number(r.totalEvaluations ?? 0) < Number(minEvals)) return false;
      return true;
    },
    [tl, minEvals],
  );

  const top = [...rows.filter(clientFilter)]
    .map((r) => ({ name: r.salesRepName, score: Number(r.avgScore ?? 0) }))
    .sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <SectionGuard section="qa:reports">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Sales Reps Performance</h1>
          <p className="text-sm text-muted-foreground">Average scores and call volume</p>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 by Average Score</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={top} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="score" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <ReportTable
          queryKey={["reports", "salesRepsPerf"]}
          endpoint="/api/Report/SalesReps"
          filename="sales-reps-performance.csv"
          searchPlaceholder="Search sales reps..."
          clientFilter={clientFilter}
          extraFilters={
            <>
              <Select value={tl} onValueChange={setTl}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Team Leader" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All team leaders</SelectItem>
                  {tls.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" min="0" placeholder="Min evaluations" value={minEvals} onChange={(e) => setMinEvals(e.target.value)} className="w-[140px]" />
            </>
          }
          columns={[
            { key: "khaznaId", header: "Khazna ID", accessor: (r: any) => r.khaznaId || "—" },
            { key: "salesRepName", header: "Sales Rep", accessor: (r: any) => r.salesRepName || "—" },
            { key: "teamLeader", header: "Team Leader", accessor: (r: any) => r.teamLeaderName || "—" },
            { key: "evaluations", header: "Evaluations", accessor: (r: any) => r.totalEvaluations ?? 0 },
            { key: "avgScore", header: "Avg Score", accessor: (r: any) => Number(r.avgScore ?? 0).toFixed(2) },
            { key: "maxScore", header: "Max", accessor: (r: any) => Number(r.maxScore ?? 0).toFixed(2) },
            { key: "minScore", header: "Min", accessor: (r: any) => Number(r.minScore ?? 0).toFixed(2) },
            { key: "highScoreCount", header: "High", accessor: (r: any) => r.highScoreCount ?? 0 },
            { key: "lowScoreCount", header: "Low", accessor: (r: any) => r.lowScoreCount ?? 0 },
          ]}
        />
      </div>
    </SectionGuard>
  );
}

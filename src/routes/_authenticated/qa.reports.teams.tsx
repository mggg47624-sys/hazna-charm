import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ReportTable } from "@/components/report-table";
import { SectionGuard } from "@/components/section-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/qa/reports/teams")({
  component: TeamsReport,
});

// Defensive: tolerate either bare array or {success, data:[...]} envelope.
const unwrap = (v: any): any[] => (Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : []);

function TeamsReport() {
  const { data } = useQuery({
    queryKey: ["reports", "teams"],
    queryFn: () => api<any>("/api/Report/Teams"),
  });
  const rows = unwrap(data);

  if (typeof window !== "undefined" && data && !Array.isArray(data)) {
    // eslint-disable-next-line no-console
    console.debug("[reports/teams] envelope detected, keys:", Object.keys(data));
  }

  const chart = rows.map((r: any) => ({
    name: r.teamLeaderName || "—",
    score: Number(r.teamAvgScore ?? 0),
  }));

  return (
    <SectionGuard section="qa:reports"><div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Teams Performance</h1>
        <p className="text-sm text-muted-foreground">Aggregated team-level metrics</p>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map((r: any) => (
            <Card key={r.teamLeaderId}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Team Leader</p>
                <p className="font-semibold truncate">{r.teamLeaderName || "—"}</p>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Reps</p>
                    <p className="font-semibold">{r.totalSalesReps ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Evaluations</p>
                    <p className="font-semibold">{r.totalEvaluations ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg</p>
                    <p className="font-semibold text-primary">{Number(r.teamAvgScore ?? 0).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">Average Score by Team</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="score" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <ReportTable
        queryKey={["reports", "teams"]}
        endpoint="/api/Report/Teams"
        filename="teams.csv"
        searchPlaceholder="Search teams..."
        columns={[
          { key: "teamLeader", header: "Team Leader", accessor: (r: any) => r.teamLeaderName || "—" },
          { key: "totalSalesReps", header: "Sales Reps", accessor: (r: any) => r.totalSalesReps ?? 0 },
          { key: "totalEvaluations", header: "Total Evaluations", accessor: (r: any) => r.totalEvaluations ?? 0 },
          { key: "teamAvgScore", header: "Avg Score", accessor: (r: any) => Number(r.teamAvgScore ?? 0).toFixed(2) },
          { key: "highScoreCount", header: "High", accessor: (r: any) => r.highScoreCount ?? 0 },
          { key: "lowScoreCount", header: "Low", accessor: (r: any) => r.lowScoreCount ?? 0 },
        ]}
      />
    </div></SectionGuard>
  );
}

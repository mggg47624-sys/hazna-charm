import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Award, CheckSquare, TrendingUp, TrendingDown, User } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/qa/reports/sales-reps/$id")({
  component: SalesRepDetail,
});

function SalesRepDetail() {
  const { id } = Route.useParams();
  const repId = Number(id);

  const repsQ = useQuery({
    queryKey: ["reports", "salesRepsPerf"],
    queryFn: () => api<any[]>("/api/Report/SalesReps"),
  });
  const evalsQ = useQuery({
    queryKey: ["reports", "evaluations"],
    queryFn: () => api<any[]>("/api/Report/Evaluations"),
  });

  const rep = useMemo(
    () => (repsQ.data || []).find((r) => Number(r.salesRepId) === repId),
    [repsQ.data, repId],
  );

  const allEvals = useMemo(
    () => (evalsQ.data || []).filter((e) => Number(e.salesRepId) === repId),
    [evalsQ.data, repId],
  );

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [minScore, setMinScore] = useState("");

  const evals = useMemo(() => {
    return allEvals.filter((e) => {
      const d = String(e.evaluatedAt || "").slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (agentFilter && !String(e.agentName || "").toLowerCase().includes(agentFilter.toLowerCase())) return false;
      if (minScore && Number(e.totalScore || 0) < Number(minScore)) return false;
      return true;
    });
  }, [allEvals, from, to, agentFilter, minScore]);

  const trend = useMemo(
    () =>
      [...evals]
        .sort((a, b) => String(a.evaluatedAt || "").localeCompare(String(b.evaluatedAt || "")))
        .slice(-20)
        .map((e) => ({
          date: String(e.evaluatedAt || "").slice(5, 10),
          score: Number(e.totalScore || 0),
        })),
    [evals],
  );

  if (repsQ.isLoading || evalsQ.isLoading) {
    return (
      <SectionGuard section="qa:reports">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </SectionGuard>
    );
  }
  if (!rep) {
    return (
      <SectionGuard section="qa:reports">
        <div className="space-y-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/qa/reports/sales-reps"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          </Button>
          <Card><CardContent className="py-10 text-center text-muted-foreground">Sales rep not found.</CardContent></Card>
        </div>
      </SectionGuard>
    );
  }

  return (
    <SectionGuard section="qa:reports">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/qa/reports/sales-reps"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Sales Reps</Link>
        </Button>

        <Card>
          <CardContent className="p-6 flex flex-wrap items-center gap-6">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <User className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-2xl font-semibold">{rep.salesRepName || "—"}</h1>
              <p className="text-sm text-muted-foreground">
                Khazna ID: <span className="font-mono">{rep.khaznaId || "—"}</span>
                {rep.teamLeaderName && <> · TL: {rep.teamLeaderName}</>}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Evaluations" value={rep.totalEvaluations ?? 0} icon={CheckSquare} />
          <KpiCard label="Avg Score" value={Number(rep.avgScore ?? 0).toFixed(2)} icon={Award} tone="success" hint="out of 5.00" />
          <KpiCard label="Max / Min" value={`${Number(rep.maxScore ?? 0).toFixed(2)} / ${Number(rep.minScore ?? 0).toFixed(2)}`} icon={TrendingUp} tone="warning" />
          <KpiCard label="High / Low Count" value={`${rep.highScoreCount ?? 0} / ${rep.lowScoreCount ?? 0}`} icon={TrendingDown} />
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Score Trend</CardTitle></CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No evaluations yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Evaluations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" />
              <Input value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} placeholder="Agent name" />
              <Input type="number" min={0} max={5} step={0.1} value={minScore} onChange={(e) => setMinScore(e.target.value)} placeholder="Min score" />
            </div>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evals.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No evaluations</TableCell></TableRow>
                  ) : (
                    [...evals]
                      .sort((a, b) => String(b.evaluatedAt || "").localeCompare(String(a.evaluatedAt || "")))
                      .slice(0, 20)
                      .map((e, i) => (
                        <TableRow key={i}>
                          <TableCell>{String(e.evaluatedAt || "").slice(0, 16).replace("T", " ")}</TableCell>
                          <TableCell>{e.customerName || "—"}</TableCell>
                          <TableCell>{e.agentName || "—"}</TableCell>
                          <TableCell>{e.transactionType || "—"}</TableCell>
                          <TableCell className="text-right font-medium">{Number(e.totalScore || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionGuard>
  );
}

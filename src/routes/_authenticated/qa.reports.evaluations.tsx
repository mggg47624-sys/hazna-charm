import { createFileRoute, Link } from "@tanstack/react-router";
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
import { KpiCard } from "@/components/kpi-card";
import { Award, CheckSquare, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface EvaluationRow {
  evaluationId: number;
  totalScore: number;
  evaluatedAt: string;
  formName?: string;
  agentName?: string;
  customerId?: number;
  customerName?: string;
  khaznaId?: string;
  transactionType?: string;
  salesRepId?: number;
  salesRepName?: string;
  teamLeaderId?: number;
  teamLeaderName?: string;
  callResult?: string;
  batchId?: number;
  batchUploadedAt?: string;
}

export const Route = createFileRoute("/_authenticated/qa/reports/evaluations")({
  component: EvalReport,
});

function EvalReport() {
  const { data } = useQuery({
    queryKey: ["reports", "evaluations"],
    queryFn: () => api<EvaluationRow[]>("/api/Report/Evaluations"),
  });
  const rows = data || [];

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rep, setRep] = useState("all");
  const [agent, setAgent] = useState("all");
  const [tl, setTl] = useState("all");
  const [minScore, setMinScore] = useState("");

  const reps = useMemo(
    () => Array.from(new Set(rows.map((r) => r.salesRepName).filter(Boolean) as string[])).sort(),
    [rows],
  );
  const agents = useMemo(
    () => Array.from(new Set(rows.map((r) => r.agentName).filter(Boolean) as string[])).sort(),
    [rows],
  );
  const leaders = useMemo(
    () => Array.from(new Set(rows.map((r) => r.teamLeaderName).filter(Boolean) as string[])).sort(),
    [rows],
  );

  const clientFilter = useMemo(
    () => (r: EvaluationRow) => {
      const d = String(r.evaluatedAt || "").slice(0, 10);
      if (from && d && d < from) return false;
      if (to && d && d > to) return false;
      if (rep !== "all" && r.salesRepName !== rep) return false;
      if (agent !== "all" && r.agentName !== agent) return false;
      if (tl !== "all" && r.teamLeaderName !== tl) return false;
      if (minScore && Number(r.totalScore || 0) < Number(minScore)) return false;
      return true;
    },
    [from, to, rep, agent, tl, minScore],
  );

  const filtered = rows.filter(clientFilter);
  const avg = filtered.length
    ? (filtered.reduce((s, r) => s + Number(r.totalScore || 0), 0) / filtered.length).toFixed(2)
    : "—";
  const top = filtered.length
    ? Math.max(...filtered.map((r) => Number(r.totalScore || 0))).toFixed(2)
    : "—";

  const buckets = { "0-1": 0, "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0 };
  filtered.forEach((r) => {
    const s = Number(r.totalScore || 0);
    if (s <= 1) buckets["0-1"]++;
    else if (s <= 2) buckets["1-2"]++;
    else if (s <= 3) buckets["2-3"]++;
    else if (s <= 4) buckets["3-4"]++;
    else buckets["4-5"]++;
  });
  const dist = Object.entries(buckets).map(([range, count]) => ({ range, count }));

  return (
    <SectionGuard section="qa:reports">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Evaluations Report</h1>
          <p className="text-sm text-muted-foreground">One row per evaluation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard label="Total Evaluations" value={filtered.length} icon={CheckSquare} />
          <KpiCard label="Average Score" value={avg} icon={Award} tone="success" hint="out of 5.00" />
          <KpiCard label="Top Score" value={top} icon={TrendingUp} tone="warning" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dist}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <ReportTable<EvaluationRow>
          queryKey={["reports", "evaluations"]}
          endpoint="/api/Report/Evaluations"
          filename="evaluations.csv"
          searchPlaceholder="Search..."
          clientFilter={clientFilter}
          extraFilters={
            <>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" />
              <Select value={rep} onValueChange={setRep}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sales Rep" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reps</SelectItem>
                  {reps.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={agent} onValueChange={setAgent}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="QA Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tl} onValueChange={setTl}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Team Leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All leaders</SelectItem>
                  {leaders.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                placeholder="Min score"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="w-[110px]"
              />
            </>
          }
          columns={[
            {
              key: "evaluatedAt",
              header: "Date",
              accessor: (r) => (r.evaluatedAt || "").toString().slice(0, 16).replace("T", " "),
            },
            { key: "customerName", header: "Customer", accessor: (r) => r.customerName || "—" },
            { key: "khaznaId", header: "Khazna ID", accessor: (r) => r.khaznaId || "—" },
            { key: "salesRepName", header: "Sales Rep", accessor: (r) => r.salesRepName || "—" },
            { key: "teamLeaderName", header: "Team Leader", accessor: (r) => r.teamLeaderName || "—" },
            { key: "transactionType", header: "Transaction", accessor: (r) => r.transactionType || "—" },
            { key: "agentName", header: "QA Agent", accessor: (r) => r.agentName || "—" },
            { key: "callResult", header: "Call Result", accessor: (r) => r.callResult || "—" },
            {
              key: "totalScore",
              header: "Score / 5",
              accessor: (r) => Number(r.totalScore || 0).toFixed(2),
            },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <Link
                  to="/qa/reports/evaluations/$id"
                  params={{ id: String(r.evaluationId) }}
                  className="text-primary hover:underline text-sm"
                >
                  View
                </Link>
              ),
            },
          ]}
        />
      </div>
    </SectionGuard>
  );
}

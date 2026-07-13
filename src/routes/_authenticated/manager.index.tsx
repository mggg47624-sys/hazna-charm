import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Phone,
  CheckSquare,
  Award,
  Megaphone,
  Users,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  ClipboardList,
  FileSpreadsheet,
  Users2,
  ListChecks,
  ArrowRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCampaigns, useWarnings } from "@/lib/ts-api";

export const Route = createFileRoute("/_authenticated/manager/")({
  component: () => (
    <SectionGuard section="manager:dashboard">
      <ManagerDashboard />
    </SectionGuard>
  ),
});

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
} as const;

function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Executive Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Read-only overview of TeleSales and Quality Assurance operations.
        </p>
      </div>
      <Tabs defaultValue="ts">
        <TabsList>
          <TabsTrigger value="ts">TeleSales</TabsTrigger>
          <TabsTrigger value="qa">Quality Assurance</TabsTrigger>
        </TabsList>
        <TabsContent value="ts" className="space-y-6 mt-4">
          <TsSection />
        </TabsContent>
        <TabsContent value="qa" className="space-y-6 mt-4">
          <QaSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ------- TeleSales section -------
function TsSection() {
  const campaigns = useCampaigns();
  const warnings = useWarnings();
  const rows = campaigns.data ?? [];
  const activeCampaigns = rows.filter((c) => c.isActive).length;
  const completedCampaigns = rows.length - activeCampaigns;
  const totalLeads = rows.reduce((s, c) => s + (c.leadsCount ?? 0), 0);
  const totalAgents = rows.reduce((s, c) => s + (c.agentsCount ?? 0), 0);
  const openWarnings = (warnings.data ?? []).filter((w) => w.status === "open").length;
  const avgProgress = rows.length
    ? Math.round(rows.reduce((s, c) => s + (c.progress ?? 0), 0) / rows.length)
    : 0;
  const progressData = rows.map((c) => ({ name: c.name, progress: c.progress ?? 0 }));

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Campaigns" value={activeCampaigns} icon={Megaphone} />
        <KpiCard label="Completed Campaigns" value={completedCampaigns} icon={CheckSquare} tone="success" />
        <KpiCard label="Total Leads" value={totalLeads} icon={TrendingUp} />
        <KpiCard label="TS Agents" value={totalAgents} icon={Users} tone="success" />
        <KpiCard label="Avg Progress" value={`${avgProgress}%`} icon={TrendingUp} />
        <KpiCard label="Open Warnings" value={openWarnings} icon={AlertTriangle} tone="warning" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={progressData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={160}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="progress" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <ReportLinks
        title="TeleSales Reports"
        links={[
          { to: "/manager/ts/campaigns", label: "Campaigns", icon: Megaphone },
          { to: "/manager/ts/calls", label: "Calls", icon: Phone },
          { to: "/manager/ts/leads", label: "Leads", icon: ClipboardList },
          { to: "/manager/ts/agents", label: "Agents", icon: UserCheck },
          { to: "/manager/ts/batches", label: "Batches", icon: FileSpreadsheet },
        ]}
      />
    </>
  );
}

// ------- Quality Assurance section -------
function QaSection() {
  const calls = useQuery({
    queryKey: ["reports", "calls"],
    queryFn: () => api<any[]>("/api/Report/Calls"),
  });
  const evals = useQuery({
    queryKey: ["reports", "evaluations"],
    queryFn: () => api<any[]>("/api/Report/Evaluations"),
  });
  const reps = useQuery({
    queryKey: ["reports", "salesReps"],
    queryFn: () => api<any[]>("/api/Report/SalesReps"),
  });

  const callRows = calls.data ?? [];
  const evalRows = evals.data ?? [];
  const repRows = reps.data ?? [];

  const totalCalls = callRows.length;
  const answered = callRows.filter((c) => {
    const r = String(c.CallResult || c.callResult || "").toLowerCase();
    return r.includes("answer") && !r.includes("no");
  }).length;
  const answerRate = totalCalls ? Math.round((answered / totalCalls) * 100) : 0;
  const avgScore = evalRows.length
    ? (
        evalRows.reduce((s, e) => s + Number(e.TotalScore || e.totalScore || 0), 0) /
        evalRows.length
      ).toFixed(2)
    : "—";

  const resultDist = callRows.reduce<Record<string, number>>((acc, c) => {
    const k = c.CallResult || c.callResult || "Unknown";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const resultData = Object.entries(resultDist).map(([name, value]) => ({ name, value }));

  const dayMap = new Map<string, number>();
  callRows.forEach((c) => {
    const d = String(c.StartTime || c.calledAt || "").slice(0, 10);
    if (d) dayMap.set(d, (dayMap.get(d) || 0) + 1);
  });
  const trend = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date: date.slice(5), count }));

  const topReps = [...repRows]
    .sort(
      (a, b) => Number(b.AvgScore ?? b.avgScore ?? 0) - Number(a.AvgScore ?? a.avgScore ?? 0),
    )
    .slice(0, 5)
    .map((r) => ({
      name: r.SalesRepName || r.salesRepName || r.fullName,
      score: Number(r.AvgScore ?? r.avgScore ?? 0),
    }));

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Calls" value={totalCalls} icon={Phone} />
        <KpiCard label="Answer Rate" value={`${answerRate}%`} icon={UserCheck} tone="success" />
        <KpiCard label="Evaluations" value={evalRows.length} icon={CheckSquare} />
        <KpiCard label="Avg Score" value={avgScore} icon={Award} tone="warning" hint="out of 100" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Calls Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={resultData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={50}
                >
                  {resultData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Sales Reps</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topReps} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <YAxis
                dataKey="name"
                type="category"
                width={140}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="score" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <ReportLinks
        title="Quality Assurance Reports"
        links={[
          { to: "/manager/qa/calls", label: "Calls", icon: Phone },
          { to: "/manager/qa/evaluations", label: "Evaluations", icon: CheckSquare },
          { to: "/manager/qa/customers", label: "Customers", icon: ListChecks },
          { to: "/manager/qa/sales-reps", label: "Sales Reps", icon: TrendingUp },
          { to: "/manager/qa/agents", label: "QA Agents", icon: UserCheck },
          { to: "/manager/qa/teams", label: "Teams", icon: Users2 },
          { to: "/manager/qa/batches", label: "Batches", icon: FileSpreadsheet },
        ]}
      />
    </>
  );
}

function ReportLinks({
  title,
  links,
}: {
  title: string;
  links: Array<{ to: string; label: string; icon: any }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {links.map((l) => (
          <Button key={l.to} asChild variant="outline" className="justify-between">
            <Link to={l.to}>
              <span className="inline-flex items-center gap-2">
                <l.icon className="h-4 w-4" /> {l.label}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

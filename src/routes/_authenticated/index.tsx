import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth, useRoleId, useCanAccess } from "@/lib/auth";
import {
  ROLE_MANAGER,
  ROLE_QA_ADMIN,
  ROLE_TS_ADMIN,
  ROLE_TS_TEAM_LEADER,
} from "@/lib/permissions";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  CheckSquare,
  UserCheck,
  Award,
  Megaphone,
  Users,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useCampaigns, useWarnings } from "@/lib/ts-api";

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardRouter,
});

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function DashboardRouter() {
  const { user, loading } = useAuth();
  const roleId = useRoleId();
  const navigate = useNavigate();

  // Agents don't have a dashboard — redirect to their workspace.
  // Manager gets the read-only executive dashboard.
  useEffect(() => {
    if (loading || !user) return;
    if (roleId === 3) navigate({ to: "/qa/work", replace: true });
    else if (roleId === 5) navigate({ to: "/ts/work", replace: true });
    else if (roleId === ROLE_MANAGER) navigate({ to: "/manager", replace: true });
  }, [loading, user, roleId, navigate]);

  if (!user) return null;

  switch (roleId) {
    case ROLE_QA_ADMIN:
      return <QaAdminDashboard />;
    case ROLE_TS_ADMIN:
    case ROLE_TS_TEAM_LEADER:
      return <TsAdminDashboard />;
    default:
      return null;
  }
}

// ============ QA Admin Dashboard ============
function QaAdminDashboard() {
  const { user } = useAuth();
  const canAgents = useCanAccess("qa:reports");
  const calls = useQuery({ queryKey: ["reports", "calls"], queryFn: () => api<any[]>("/api/Report/Calls"), enabled: canAgents });
  const evals = useQuery({ queryKey: ["reports", "evaluations"], queryFn: () => api<any[]>("/api/Report/Evaluations") });
  const reps = useQuery({ queryKey: ["reports", "salesReps"], queryFn: () => api<any[]>("/api/Report/SalesReps") });

  const callRows = calls.data || [];
  const evalRows = evals.data || [];
  const repRows = reps.data || [];

  const totalCalls = callRows.length;
  const answered = callRows.filter((c) => {
    const r = String(c.CallResult || c.callResult || "").toLowerCase();
    return r.includes("answer") && !r.includes("no");
  }).length;
  const answerRate = totalCalls ? Math.round((answered / totalCalls) * 100) : 0;
  const avgScore = evalRows.length
    ? (evalRows.reduce((s, e) => s + Number(e.TotalScore || 0), 0) / evalRows.length).toFixed(2)
    : "—";

  const resultDist = callRows.reduce<Record<string, number>>((acc, c) => {
    const k = c.CallResult || c.callResult || "Unknown";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const resultData = Object.entries(resultDist).map(([name, value]) => ({ name, value }));

  const dayMap = new Map<string, number>();
  callRows.forEach((c) => {
    const d = String(c.StartTime || c.callDate || "").slice(0, 10);
    if (d) dayMap.set(d, (dayMap.get(d) || 0) + 1);
  });
  const trend = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-14)
    .map(([date, count]) => ({ date: date.slice(5), count }));

  const topReps = [...repRows]
    .sort((a, b) => Number(b.AvgScore ?? 0) - Number(a.AvgScore ?? 0))
    .slice(0, 5)
    .map((r) => ({ name: r.SalesRepName || r.fullName, score: Number(r.AvgScore ?? 0) }));

  return (
    <div className="space-y-6">
      <Header title="QA Dashboard" subtitle={`Welcome back, ${user?.fullName || user?.userName}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Calls" value={totalCalls} icon={Phone} />
        <KpiCard label="Answer Rate" value={`${answerRate}%`} icon={UserCheck} tone="success" />
        <KpiCard label="Evaluations" value={evalRows.length} icon={CheckSquare} />
        <KpiCard label="Avg Score" value={avgScore} icon={Award} tone="warning" hint="out of 100" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Calls Over Time" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Call Results">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={resultData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                {resultData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Top Sales Reps">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topReps} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="score" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

// ============ TS Admin / Team Leader Dashboard ============
function TsAdminDashboard() {
  const { user } = useAuth();
  const campaigns = useCampaigns();
  const warnings = useWarnings();
  const rows = campaigns.data ?? [];
  const openWarnings = (warnings.data ?? []).filter((w) => w.status === "open").length;

  const activeCampaigns = rows.filter((c) => c.isActive).length;
  const totalLeads = rows.reduce((s, c) => s + (c.leadsCount ?? 0), 0);
  const totalAgents = rows.reduce((s, c) => s + (c.agentsCount ?? 0), 0);
  const avgProgress = rows.length
    ? Math.round(rows.reduce((s, c) => s + (c.progress ?? 0), 0) / rows.length)
    : 0;

  const progressData = rows.map((c) => ({ name: c.name, progress: c.progress ?? 0 }));

  return (
    <div className="space-y-6">
      <Header title="TeleSales Dashboard" subtitle={`Welcome back, ${user?.fullName || user?.userName}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Campaigns" value={activeCampaigns} icon={Megaphone} />
        <KpiCard label="TS Agents" value={totalAgents} icon={Users} tone="success" />
        <KpiCard label="Leads" value={totalLeads} icon={TrendingUp} />
        <KpiCard label="Open Warnings" value={openWarnings} icon={AlertTriangle} tone="warning" />
      </div>
      <ChartCard title="Campaign Progress">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={progressData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="progress" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="text-xs text-muted-foreground">Avg progress across campaigns: {avgProgress}%</div>
    </div>
  );
}

// ============ Manager Dashboard (both systems) ============
function ManagerDashboard() {
  const { user } = useAuth();
  const qaCalls = useQuery({ queryKey: ["reports", "calls"], queryFn: () => api<any[]>("/api/Report/Calls") });
  const qaEvals = useQuery({ queryKey: ["reports", "evaluations"], queryFn: () => api<any[]>("/api/Report/Evaluations") });
  const campaigns = useCampaigns();

  const totalQaCalls = qaCalls.data?.length ?? 0;
  const totalEvals = qaEvals.data?.length ?? 0;
  const activeCampaigns = (campaigns.data ?? []).filter((c) => c.isActive).length;
  const totalLeads = (campaigns.data ?? []).reduce((s, c) => s + (c.leadsCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <Header title="Overview" subtitle={`Welcome back, ${user?.fullName || user?.userName}`} />
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">QA</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Calls" value={totalQaCalls} icon={Phone} />
          <KpiCard label="Evaluations" value={totalEvals} icon={CheckSquare} tone="success" />
        </div>
      </div>
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">TeleSales</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Active Campaigns" value={activeCampaigns} icon={Megaphone} />
          <KpiCard label="Leads" value={totalLeads} icon={TrendingUp} tone="success" />
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
} as const;

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
function ChartCard({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <Card className={className}>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { SectionGuard } from "@/components/section-guard";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/cf/cf-ui";
import { useCfAdminDashboard } from "@/lib/cf-api";
import { CheckCircle2, Clock, FileText, Users, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cf/admin/")({
  head: () => ({ meta: [{ title: "CF Admin Dashboard — Khazna" }] }),
  component: () => <SectionGuard section="cf:admin"><Page /></SectionGuard>,
});

const tick = { fontSize: 11, fill: "var(--muted-foreground)" };

function Page() {
  const { data: d } = useCfAdminDashboard();
  return (
    <div className="space-y-6">
      <PageHeader title="Consumer Finance — Overview" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Customers in list" value={d?.totalCustomersInList ?? "—"} icon={Users} />
        <KpiCard label="Registrations" value={d?.totalRegistrations ?? "—"} icon={FileText} />
        <KpiCard label="Under review" value={d?.underReview ?? "—"} icon={Clock} tone="warning" />
        <KpiCard label="Approved" value={d?.approved ?? "—"} icon={CheckCircle2} tone="success" />
        <KpiCard label="Rejected" value={d?.rejected ?? "—"} icon={XCircle} tone="danger" />
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Daily registrations</CardTitle></CardHeader>
        <CardContent><ResponsiveContainer width="100%" height={260}>
          <LineChart data={d?.dailyTrend ?? []}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" tick={tick} /><YAxis allowDecimals={false} tick={tick} /><Tooltip /><Line dataKey="count" stroke="var(--chart-1)" strokeWidth={2} /></LineChart>
        </ResponsiveContainer></CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">By agent</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={260}>
            <BarChart data={d?.byAgent ?? []}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="agentName" tick={tick} /><YAxis allowDecimals={false} tick={tick} /><Tooltip /><Legend />
              <Bar dataKey="approved" stackId="a" fill="var(--chart-2)" /><Bar dataKey="underReview" stackId="a" fill="var(--chart-4)" /><Bar dataKey="rejected" stackId="a" fill="var(--chart-5)" />
            </BarChart>
          </ResponsiveContainer></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">By channel</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={260}>
            <BarChart data={d?.byChannel ?? []}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="channelName" tick={tick} /><YAxis allowDecimals={false} tick={tick} /><Tooltip /><Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer></CardContent>
        </Card>
      </div>
    </div>
  );
}

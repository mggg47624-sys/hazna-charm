import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionGuard } from "@/components/section-guard";
import { KpiCard } from "@/components/kpi-card";
import { FilterBar, type FilterValues } from "@/components/filters/filter-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CfTable, PageHeader } from "@/components/cf/cf-ui";
import { useCfTeamSummary } from "@/lib/cf-api";
import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cf/team")({
  head: () => ({ meta: [
    { title: "CF Team Summary — Khazna" },
    { name: "description", content: "Read-only Consumer Finance team performance by agent and channel." },
    { property: "og:title", content: "CF Team Summary — Khazna" },
    { property: "og:description", content: "Read-only Consumer Finance team performance by agent and channel." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SectionGuard section="cf:team"><Page /></SectionGuard>,
});

function Page() {
  const [f, setF] = useState<FilterValues>({});
  const { data, isLoading } = useCfTeamSummary({ from: f.dateFrom, to: f.dateTo });
  return (
    <div className="space-y-6">
      <PageHeader title="Consumer Finance — Team" subtitle="Read-only summary" />
      <FilterBar fields={["dateFrom", "dateTo"]} values={f} onChange={setF} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total" value={data?.total ?? "—"} icon={FileText} />
        <KpiCard label="Under review" value={data?.underReview ?? "—"} icon={Clock} tone="warning" />
        <KpiCard label="Approved" value={data?.approved ?? "—"} icon={CheckCircle2} tone="success" />
        <KpiCard label="Rejected" value={data?.rejected ?? "—"} icon={XCircle} tone="danger" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CfTable loading={isLoading} rows={data?.byAgent ?? []} rowKey={(r) => r.agentId} columns={[
            { key: "agentName", header: "Agent", render: (r) => <span dir="auto">{r.agentName}</span> },
            { key: "total", header: "Total" }, { key: "underReview", header: "Under review" },
            { key: "approved", header: "Approved" }, { key: "rejected", header: "Rejected" },
          ]} />
        </div>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">By channel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.byChannel ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="channelName" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip /><Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { SectionGuard } from "@/components/section-guard";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/cf/cf-ui";
import { useCfAgentDashboard } from "@/lib/cf-api";
import { CheckCircle2, Clock, FileText, UserPlus, XCircle, List } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cf/agent/")({
  head: () => ({ meta: [
    { title: "CF Agent Dashboard — Khazna" },
    { name: "description", content: "Track your Consumer Finance customer registrations and review outcomes." },
    { property: "og:title", content: "CF Agent Dashboard — Khazna" },
    { property: "og:description", content: "Track your Consumer Finance customer registrations and review outcomes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SectionGuard section="cf:agent"><Page /></SectionGuard>,
});

function Page() {
  const { data } = useCfAgentDashboard();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Consumer Finance" subtitle="Your registrations" />
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Total" value={data?.total ?? "—"} icon={FileText} />
        <KpiCard label="Under review" value={data?.underReview ?? "—"} icon={Clock} tone="warning" />
        <KpiCard label="Approved" value={data?.approved ?? "—"} icon={CheckCircle2} tone="success" />
        <KpiCard label="Rejected" value={data?.rejected ?? "—"} icon={XCircle} tone="danger" />
      </div>
      <Button asChild className="h-16 w-full text-lg"><Link to="/cf/agent/new"><UserPlus className="mr-2 h-5 w-5" />Add new customer</Link></Button>
      <Button asChild variant="outline" className="h-14 w-full"><Link to="/cf/agent/registrations"><List className="mr-2 h-5 w-5" />My customers</Link></Button>
    </div>
  );
}

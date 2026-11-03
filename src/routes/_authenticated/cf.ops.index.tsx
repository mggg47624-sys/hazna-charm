import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SectionGuard } from "@/components/section-guard";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { CfTable, PageHeader, fmtDateTime } from "@/components/cf/cf-ui";
import { useCfOpsDashboard, useCfOpsQueue } from "@/lib/cf-api";
import { useCanAccess } from "@/lib/auth";
import { CheckCircle2, Clock, ListChecks, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cf/ops/")({
  head: () => ({ meta: [{ title: "CF Ops Review Queue — Khazna" }] }),
  component: () => <SectionGuard section="cf:ops-view"><Page /></SectionGuard>,
});

function Page() {
  const canReview = useCanAccess("cf:ops");
  const [page, setPage] = useState(1);
  const dash = useCfOpsDashboard();
  const q = useCfOpsQueue({ page });
  const d = dash.data;
  return (
    <div className="space-y-6">
      <PageHeader title="Ops review" subtitle={canReview ? "Pending registrations, oldest first" : "Read-only view"} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Pending" value={d?.pending ?? "—"} icon={Clock} tone="warning" />
        <KpiCard label="Reviewed today" value={d?.reviewedToday ?? "—"} icon={ListChecks} />
        <KpiCard label="Approved by me" value={d?.approvedByMe ?? "—"} icon={CheckCircle2} tone="success" />
        <KpiCard label="Rejected by me" value={d?.rejectedByMe ?? "—"} icon={XCircle} tone="danger" />
      </div>
      <CfTable loading={q.isLoading} rows={q.data?.items ?? []} rowKey={(r) => r.id} page={page} total={q.data?.total} pageSize={q.data?.pageSize} onPage={setPage}
        empty="Queue is empty" columns={[
          { key: "customerName", header: "Customer", render: (r) => <span dir="auto">{r.customerName}</span> },
          { key: "nationalId", header: "National ID" },
          { key: "agentName", header: "Agent", render: (r) => <span dir="auto">{r.agentName}</span> },
          { key: "channelName", header: "Channel" },
          { key: "submittedAt", header: "Submitted", render: (r) => fmtDateTime(r.submittedAt) },
          { key: "action", header: "", render: (r) => canReview
            ? <Button asChild size="sm"><Link to="/cf/ops/review/$id" params={{ id: String(r.id) }}>Review</Link></Button>
            : <Button asChild size="sm" variant="outline"><Link to="/cf/ops/history/$id" params={{ id: String(r.id) }}>View</Link></Button> },
        ]} />
    </div>
  );
}

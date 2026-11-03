import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SectionGuard } from "@/components/section-guard";
import { FilterBar, type FilterValues } from "@/components/filters/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CfTable, DecisionBadge, PageHeader, fmtDateTime } from "@/components/cf/cf-ui";
import { useCfOpsHistory } from "@/lib/cf-api";

export const Route = createFileRoute("/_authenticated/cf/ops/history/")({
  head: () => ({ meta: [{ title: "Review History — Consumer Finance" }] }),
  component: () => <SectionGuard section="cf:ops-view"><Page /></SectionGuard>,
});

function Page() {
  const [f, setF] = useState<FilterValues>({});
  const [decision, setDecision] = useState("all");
  const [page, setPage] = useState(1);
  const q = useCfOpsHistory({ from: f.dateFrom, to: f.dateTo, decision: decision === "all" ? "" : decision, page });
  return (
    <div className="space-y-4">
      <PageHeader title="Review history" />
      <div className="flex flex-wrap items-end gap-3">
        <FilterBar fields={["dateFrom", "dateTo"]} values={f} onChange={(v) => { setF(v); setPage(1); }} />
        <Select value={decision} onValueChange={(v) => { setDecision(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All decisions</SelectItem><SelectItem value="approve">Approved</SelectItem><SelectItem value="reject">Rejected</SelectItem></SelectContent>
        </Select>
      </div>
      <CfTable loading={q.isLoading} rows={q.data?.items ?? []} rowKey={(r) => r.id} page={page} total={q.data?.total} pageSize={q.data?.pageSize} onPage={setPage} columns={[
        { key: "customerName", header: "Customer", render: (r) => <span dir="auto">{r.customerName}</span> },
        { key: "nationalId", header: "National ID" },
        { key: "decision", header: "Decision", render: (r) => <DecisionBadge decision={r.decision} /> },
        { key: "reasons", header: "Reasons", render: (r) => <div className="flex flex-wrap gap-1">{r.reasons.map((x) => <Badge key={x} variant="outline" dir="auto">{x}</Badge>)}</div> },
        { key: "reviewedAt", header: "Date", render: (r) => fmtDateTime(r.reviewedAt) },
        { key: "view", header: "", render: (r) => <Button asChild size="sm" variant="outline"><Link to="/cf/ops/history/$id" params={{ id: String(r.registrationId) }}>View</Link></Button> },
      ]} />
    </div>
  );
}

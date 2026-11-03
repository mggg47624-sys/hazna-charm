import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SectionGuard } from "@/components/section-guard";
import { FilterBar, type FilterValues } from "@/components/filters/filter-bar";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CfTable, PageHeader, StatusBadge, fmtDate } from "@/components/cf/cf-ui";
import { useCfAdminDashboard, useCfAdminRegistrations } from "@/lib/cf-api";
import { CF_CHANNELS } from "@/lib/cf-types";

export const Route = createFileRoute("/_authenticated/cf/admin/registrations/")({
  head: () => ({ meta: [{ title: "All Registrations — Consumer Finance" }] }),
  component: () => <SectionGuard section="cf:admin"><Page /></SectionGuard>,
});

const all = (v: string) => (v === "all" ? "" : v);

function Page() {
  const [f, setF] = useState<FilterValues>({});
  const [status, setStatus] = useState("all");
  const [channel, setChannel] = useState("all");
  const [page, setPage] = useState(1);
  const agents = useCfAdminDashboard().data?.byAgent ?? [];
  const q = useCfAdminRegistrations({ search: f.search, agentId: f.agentId, from: f.dateFrom, to: f.dateTo, status: all(status), channelId: all(channel), page });
  const reset = (fn: () => void) => { fn(); setPage(1); };
  return (
    <div className="space-y-4">
      <PageHeader title="All registrations" actions={<ExportButton rows={q.data?.items} filename="cf-registrations" />} />
      <div className="flex flex-wrap items-end gap-3">
        <FilterBar fields={["search", "agentId", "dateFrom", "dateTo"]} values={f} onChange={(v) => reset(() => setF(v))}
          options={{ agentId: agents.map((a) => ({ value: String(a.agentId), label: a.agentName })) }} />
        <Select value={status} onValueChange={(v) => reset(() => setStatus(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="1">Under review</SelectItem><SelectItem value="2">Approved</SelectItem><SelectItem value="3">Rejected</SelectItem></SelectContent>
        </Select>
        <Select value={channel} onValueChange={(v) => reset(() => setChannel(v))}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All channels</SelectItem>{CF_CHANNELS.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <CfTable loading={q.isLoading} rows={q.data?.items ?? []} rowKey={(r) => r.id} page={page} total={q.data?.total} pageSize={q.data?.pageSize} onPage={setPage} columns={[
        { key: "customerName", header: "Customer", render: (r) => <span dir="auto">{r.customerName}</span> },
        { key: "nationalId", header: "National ID" },
        { key: "agentName", header: "Agent", render: (r) => <span dir="auto">{r.agentName}</span> },
        { key: "channelName", header: "Channel" }, { key: "amount", header: "Amount" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "createdAt", header: "Date", render: (r) => fmtDate(r.createdAt) },
        { key: "view", header: "", render: (r) => <Button asChild size="sm" variant="outline"><Link to="/cf/admin/registrations/$id" params={{ id: String(r.id) }}>View</Link></Button> },
      ]} />
    </div>
  );
}

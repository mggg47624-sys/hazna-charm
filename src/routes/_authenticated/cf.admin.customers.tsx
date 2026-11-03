import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SectionGuard } from "@/components/section-guard";
import { FilterBar, type FilterValues } from "@/components/filters/filter-bar";
import { ExportButton } from "@/components/export-button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CfTable, PageHeader } from "@/components/cf/cf-ui";
import { useCfAdminCustomers, useCfBatches } from "@/lib/cf-api";

export const Route = createFileRoute("/_authenticated/cf/admin/customers")({
  head: () => ({ meta: [{ title: "Eligible Customers — Consumer Finance" }] }),
  component: () => <SectionGuard section="cf:admin"><Page /></SectionGuard>,
});

function Page() {
  const [f, setF] = useState<FilterValues>({});
  const [hasContract, setHasContract] = useState("all");
  const [page, setPage] = useState(1);
  const batches = useCfBatches().data ?? [];
  const q = useCfAdminCustomers({ search: f.search || f.mobile, batchId: f.batchId, hasContract: hasContract === "all" ? "" : hasContract, page });
  return (
    <div className="space-y-4">
      <PageHeader title="Eligible customers" actions={<ExportButton rows={q.data?.items} filename="cf-customers" />} />
      <div className="flex flex-wrap items-end gap-3">
        <FilterBar fields={["search", "mobile", "batchId"]} values={f} onChange={(v) => { setF(v); setPage(1); }}
          options={{ batchId: batches.map((b) => ({ value: String(b.id), label: b.fileName })) }} />
        <Select value={hasContract} onValueChange={(v) => { setHasContract(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Any contract</SelectItem><SelectItem value="true">Has contract</SelectItem><SelectItem value="false">No contract</SelectItem></SelectContent>
        </Select>
      </div>
      <CfTable loading={q.isLoading} rows={q.data?.items ?? []} rowKey={(r) => r.nationalId} page={page} total={q.data?.total} pageSize={q.data?.pageSize} onPage={setPage} columns={[
        { key: "nationalId", header: "National ID" },
        { key: "customerName", header: "Customer Name", render: (r) => <span dir="auto">{r.customerName}</span> },
        { key: "company", header: "Company", render: (r) => <span dir="auto">{r.company}</span> },
        { key: "contactNumber", header: "Contact Number" }, { key: "approvedLimit", header: "Approved Limit" },
        { key: "hasContract", header: "Has contract", render: (r) => <Badge variant={r.hasContract ? "default" : "outline"}>{r.hasContract ? "Yes" : "No"}</Badge> },
        { key: "batchId", header: "Batch", render: (r) => r.batchName ?? r.batchId },
      ]} />
    </div>
  );
}

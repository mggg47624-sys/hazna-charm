import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SectionGuard } from "@/components/section-guard";
import { FilterBar, type FilterValues } from "@/components/filters/filter-bar";
import { ExportButton } from "@/components/export-button";
import { CfTable, PageHeader, fmtDateTime } from "@/components/cf/cf-ui";
import { useCfBatches } from "@/lib/cf-api";

export const Route = createFileRoute("/_authenticated/cf/admin/batches")({
  head: () => ({ meta: [{ title: "Import Batches — Consumer Finance" }] }),
  component: () => <SectionGuard section="cf:admin"><Page /></SectionGuard>,
});

function Page() {
  const [f, setF] = useState<FilterValues>({});
  const { data, isLoading } = useCfBatches();
  const rows = useMemo(() => (data ?? []).filter((b) => {
    const d = b.uploadedAt.slice(0, 10);
    const s = (f.search ?? "").toLowerCase();
    return (!s || `${b.fileName} ${b.uploadedByName}`.toLowerCase().includes(s)) && (!f.dateFrom || d >= f.dateFrom) && (!f.dateTo || d <= f.dateTo);
  }), [data, f]);
  return (
    <div className="space-y-4">
      <PageHeader title="Import batches" actions={<ExportButton rows={rows} filename="cf-batches" />} />
      <FilterBar fields={["search", "dateFrom", "dateTo"]} values={f} onChange={setF} />
      <CfTable loading={isLoading} rows={rows} rowKey={(r) => r.id} columns={[
        { key: "id", header: "#" }, { key: "fileName", header: "File" },
        { key: "uploadedByName", header: "Uploaded by", render: (r) => <span dir="auto">{r.uploadedByName}</span> },
        { key: "uploadedAt", header: "Uploaded at", render: (r) => fmtDateTime(r.uploadedAt) },
        { key: "rowsCount", header: "Rows" }, { key: "insertedCount", header: "Inserted" }, { key: "updatedCount", header: "Updated" },
        { key: "skippedCount", header: "Skipped" }, { key: "invalidCount", header: "Invalid" },
      ]} />
    </div>
  );
}

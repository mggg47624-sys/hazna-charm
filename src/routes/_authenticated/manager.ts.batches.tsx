import { createFileRoute } from "@tanstack/react-router";
import { ManagerReport } from "@/components/manager-report";

export const Route = createFileRoute("/_authenticated/manager/ts/batches")({
  component: () => (
    <ManagerReport
      section="manager:ts"
      title="Batches"
      subtitle="All TeleSales batches (read-only)"
      endpoint="/api/ts/Batch"
      queryKey={["ts", "batches"]}
      filename="ts-batches"
      filterFields={["search", "dateFrom", "dateTo", "campaignId"]}
      filterAccessors={{
        dateFrom: (r: any) => r.uploadedAt,
        dateTo: (r: any) => r.uploadedAt,
        campaignId: (r: any) => r.campaignId,
      }}
      searchKeys={[(r: any) => r.name, (r: any) => r.campaignName, (r: any) => r.uploadedBy]}
      columns={[
        { key: "name", header: "Batch", accessor: (r: any) => r.name },
        { key: "campaignName", header: "Campaign", accessor: (r: any) => r.campaignName || "—" },
        { key: "uploadedAt", header: "Uploaded", accessor: (r: any) => new Date(r.uploadedAt).toLocaleString() },
        { key: "uploadedBy", header: "Uploaded By", accessor: (r: any) => r.uploadedBy || "—" },
        { key: "totalLeads", header: "Total", accessor: (r: any) => r.totalLeads },
        { key: "processedLeads", header: "Processed", accessor: (r: any) => r.processedLeads },
        { key: "duplicateLeads", header: "Duplicates", accessor: (r: any) => r.duplicateLeads },
        { key: "status", header: "Status", accessor: (r: any) => r.status },
      ]}
    />
  ),
});

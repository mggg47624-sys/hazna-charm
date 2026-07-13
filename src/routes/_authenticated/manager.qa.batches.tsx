import { createFileRoute } from "@tanstack/react-router";
import { ManagerReport } from "@/components/manager-report";

export const Route = createFileRoute("/_authenticated/manager/qa/batches")({
  component: () => (
    <ManagerReport
      section="manager:qa"
      title="QA Batches"
      subtitle="Import batch history (read-only)"
      endpoint="/api/Report/Batches"
      queryKey={["reports", "batches"]}
      filename="qa-batches"
      filterFields={["search", "dateFrom", "dateTo"]}
      filterAccessors={{
        dateFrom: (r: any) => r.UploadedAt || r.uploadedAt,
        dateTo: (r: any) => r.UploadedAt || r.uploadedAt,
      }}
      searchKeys={[(r: any) => r.BatchName || r.batchName, (r: any) => r.UploadedBy || r.uploadedBy]}
      columns={[
        { key: "batchName", header: "Batch", accessor: (r: any) => r.BatchName || r.batchName || "—" },
        {
          key: "uploadedAt",
          header: "Uploaded",
          accessor: (r: any) =>
            new Date(r.UploadedAt || r.uploadedAt).toLocaleString(),
        },
        { key: "uploadedBy", header: "Uploaded By", accessor: (r: any) => r.UploadedBy || r.uploadedBy || "—" },
        { key: "totalRows", header: "Total", accessor: (r: any) => r.TotalRows ?? r.totalRows ?? 0 },
        { key: "validRows", header: "Valid", accessor: (r: any) => r.ValidRows ?? r.validRows ?? 0 },
        { key: "duplicateRows", header: "Duplicates", accessor: (r: any) => r.DuplicateRows ?? r.duplicateRows ?? 0 },
        { key: "errorRows", header: "Errors", accessor: (r: any) => r.ErrorRows ?? r.errorRows ?? 0 },
      ]}
    />
  ),
});

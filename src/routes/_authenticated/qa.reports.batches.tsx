import { createFileRoute } from "@tanstack/react-router";
import { ReportTable } from "@/components/report-table";
import { SectionGuard } from "@/components/section-guard";

export const Route = createFileRoute("/_authenticated/qa/reports/batches")({
  component: BatchesReport,
});

function BatchesReport() {
  return (
    <SectionGuard section="qa:reports">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Import Batches</h1>
          <p className="text-sm text-muted-foreground">Summary of all uploaded sheets</p>
        </div>
        <ReportTable
          queryKey={["reports", "batches"]}
          endpoint="/api/Report/Batches"
          filename="batches.csv"
          searchPlaceholder="Search batches..."
          columns={[
            { key: "batchId", header: "Batch ID", accessor: (r: any) => r.batchId || r.id },
            { key: "uploadedAt", header: "Uploaded", accessor: (r: any) => (r.uploadedAt || r.createdAt || "").toString().slice(0, 16).replace("T", " ") },
            { key: "uploadedBy", header: "By", accessor: (r: any) => r.uploadedByName || r.uploadedBy },
            { key: "totalRows", header: "Total" },
            { key: "validRows", header: "Valid" },
            { key: "duplicateRows", header: "Duplicates" },
            { key: "errorRows", header: "Errors" },
          ]}
        />
      </div>
    </SectionGuard>
  );
}

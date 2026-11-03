import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CfTable, PageHeader } from "@/components/cf/cf-ui";
import { useCfImportCustomers } from "@/lib/cf-api";
import type { CfImportSummary } from "@/lib/cf-types";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, RefreshCw, SkipForward, Upload, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cf/admin/import")({
  head: () => ({ meta: [{ title: "Import Eligible Customers — Consumer Finance" }] }),
  component: () => <SectionGuard section="cf:admin"><Page /></SectionGuard>,
});

function exportIssuesCsv(s: CfImportSummary) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = ["rowNum,nationalId,reason", ...s.issues.map((i) => [i.rowNum, i.nationalId, i.reason].map(esc).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = "import-issues.csv";
  a.click();
}

function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<CfImportSummary | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const upload = useCfImportCustomers();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Import eligible customers" subtitle="Upload the Excel list of eligible customers" />
      <Card>
        <CardHeader><CardTitle className="text-base">Excel file (.xlsx)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <button onClick={() => ref.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 hover:bg-muted/50">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm">{file ? file.name : "Click to choose a .xlsx file"}</span>
          </button>
          <input ref={ref} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f && !f.name.toLowerCase().endsWith(".xlsx")) return toast.error("Only .xlsx files are allowed"); setFile(f ?? null); }} />
          <Alert><AlertDescription>Columns are read by their header names, so column order does not matter.</AlertDescription></Alert>
          <Button disabled={!file || upload.isPending} onClick={() => file && upload.mutate(file, { onSuccess: (d) => { setSummary(d); toast.success("Import completed"); }, onError: (e) => toast.error(e.message) })}>
            {upload.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload
          </Button>
        </CardContent>
      </Card>
      {summary && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Inserted" value={summary.inserted} icon={CheckCircle2} tone="success" />
            <KpiCard label="Updated" value={summary.updated} icon={RefreshCw} />
            <KpiCard label="Skipped" value={summary.skipped} icon={SkipForward} tone="warning" />
            <KpiCard label="Invalid" value={summary.invalid} icon={XCircle} tone="danger" />
          </div>
          {!!summary.issues.length && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" />Issues</h2>
                <Button variant="outline" size="sm" onClick={() => exportIssuesCsv(summary)}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
              </div>
              <CfTable rows={summary.issues} rowKey={(r) => `${r.rowNum}-${r.nationalId}`} columns={[
                { key: "rowNum", header: "Row" }, { key: "nationalId", header: "National ID" },
                { key: "reason", header: "Reason", render: (r) => <span dir="auto">{r.reason}</span> },
              ]} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

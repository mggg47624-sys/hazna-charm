import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ImportSummary } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";

export const Route = createFileRoute("/_authenticated/qa/admin/import")({
  component: ImportPage,
});

function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Select a file");
      const fd = new FormData();
      fd.append("file", file);
      return api<ImportSummary>("/api/Import", { method: "POST", body: fd, isForm: true });
    },
    onSuccess: (d) => {
      setSummary(d);
      toast.success(`Imported: ${d.validRows} valid / ${d.totalRows} total`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SectionGuard section="qa:admin"><div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Import Customers</h1>
        <p className="text-sm text-muted-foreground">Upload an Excel sheet to populate the call queue</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Upload File</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Excel File</Label>
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/30 transition"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">
                {file ? file.name : "Click or drag an Excel file here"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx or .xls</p>
            </div>
          </div>

          <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
            {upload.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader><CardTitle className="text-base">Import Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat icon={FileSpreadsheet} label="Total Rows" value={summary.totalRows} tone="muted" />
              <Stat icon={CheckCircle2} label="Valid" value={summary.validRows} tone="success" />
              <Stat icon={Copy} label="Duplicates" value={summary.duplicateRows} tone="warning" />
              <Stat icon={XCircle} label="Errors" value={summary.errorRows} tone="danger" />
            </div>
            {summary.errors && summary.errors.length > 0 && (
              <div className="mt-4 border rounded-lg p-3 bg-destructive/5">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                  <AlertTriangle className="h-4 w-4" /> Errors
                </div>
                <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
                  {summary.errors.map((e, i) => (
                    <li key={i}>Row {e.row}: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30">
        <CardHeader><CardTitle className="text-base">Expected Format</CardTitle></CardHeader>
        <CardContent>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Col 1: Khazna ID</li>
            <li>Col 2: Phone</li>
            <li>Col 3: Full Name</li>
            <li>Col 4: Status ID (1=Active, 2=Pending, 3=Inactive)</li>
            <li>Col 5: Company Name</li>
            <li>Col 6: Transaction Type ID (1, 2, or 3)</li>
            <li>Col 7: Sales Rep Khazna ID</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-3">Row 1 is treated as the header and skipped.</p>
        </CardContent>
      </Card>
    </div></SectionGuard>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  const toneCls =
    tone === "success" ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" :
    tone === "warning" ? "bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]" :
    tone === "danger" ? "bg-destructive/15 text-destructive" :
    "bg-muted text-muted-foreground";
  return (
    <div className="rounded-lg border p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneCls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { useCampaigns, useUploadActivation } from "@/lib/ts-api";

export const Route = createFileRoute("/_authenticated/ts/admin/activation")({
  component: () => (
    <SectionGuard section="ts:admin-dumps">
      <Page />
    </SectionGuard>
  ),
});

function Page() {
  const campaigns = useCampaigns();
  const [cid, setCid] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const upload = useUploadActivation();
  const [result, setResult] = useState<{ matchedLeads: number; unmatchedLeads: number } | null>(null);

  const submit = () => {
    if (!cid) return toast.error("Pick a campaign");
    if (!file) return toast.error("Attach the Excel file");
    upload.mutate(
      { campaignId: Number(cid), file },
      {
        onSuccess: (r) => { setResult(r); toast.success(`Matched ${r.matchedLeads}, unmatched ${r.unmatchedLeads}`); },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Activation Dump</h1>
        <p className="text-sm text-muted-foreground">
          Matches within 30 days of last call are marked as Completed.
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Upload</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Select Campaign</Label>
            <CampaignSelector
              value={cid ? Number(cid) : undefined}
              onChange={(v) => setCid(v ? String(v) : "")}
              hideLabel
              triggerClassName="w-full"
            />
          </div>

          <div>
            <Label>Excel file</Label>
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground mt-1">
              Columns: Phone, Full Name, Company, Activation Date.
            </p>
          </div>
          <Button disabled={upload.isPending} onClick={submit}>
            {upload.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
          {result && (
            <div className="p-3 rounded border bg-muted/30 text-sm">
              <strong>Matched:</strong> {result.matchedLeads} · <strong>Unmatched:</strong> {result.unmatchedLeads}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

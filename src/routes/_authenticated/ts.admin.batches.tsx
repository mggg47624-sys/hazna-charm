import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { useBatches, useCampaigns, useUploadBatch } from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";

export const Route = createFileRoute("/_authenticated/ts/admin/batches")({
  component: () => (
    <SectionGuard section="ts:admin">
      <BatchesPage />
    </SectionGuard>
  ),
});

function BatchesPage() {
  const list = useBatches();
  const campaigns = useCampaigns();
  const upload = useUploadBatch();

  const [open, setOpen] = useState(false);
  const [campaignId, setCampaignId] = useState<string>("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const submit = () => {
    if (!campaignId) return toast.error("Pick a campaign");
    if (!name.trim()) return toast.error("Batch name required");
    upload.mutate(
      { campaignId: Number(campaignId), name },
      {
        onSuccess: () => {
          toast.success(file ? `Batch created — will process ${file.name}` : "Batch created");
          setOpen(false); setCampaignId(""); setName(""); setFile(null);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Batches</h1>
          <p className="text-sm text-muted-foreground">Upload and manage lead batches per campaign.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            rows={list.data ?? []}
            filename="ts-batches"
            columns={[
              { label: "ID", key: "id" },
              { label: "Campaign", key: "campaignName" },
              { label: "Name", key: "name" },
              { label: "Uploaded By", key: "uploadedBy" },
              { label: "Uploaded At", key: "uploadedAt" },
              { label: "Total", key: "totalLeads" },
              { label: "Processed", key: "processedLeads" },
              { label: "Duplicates", key: "duplicateLeads" },
              { label: "Status", key: "status" },
            ]}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Upload className="h-4 w-4 mr-2" /> Upload Batch</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Leads Batch</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Campaign</Label>
                  <Select value={campaignId} onValueChange={setCampaignId}>
                    <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                    <SelectContent>
                      {campaigns.data?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Batch name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div>
                  <Label>CSV / Excel file</Label>
                  <Input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Backend parses columns: name, phone, company, city, notes.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={upload.isPending} onClick={submit}>
                  {upload.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Batch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All batches</CardTitle></CardHeader>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Processed</TableHead>
                    <TableHead className="text-right">Duplicates</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list.data ?? []).map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-muted-foreground">{b.campaignName ?? b.campaignId}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(b.uploadedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">{b.totalLeads}</TableCell>
                      <TableCell className="text-right">{b.processedLeads}</TableCell>
                      <TableCell className="text-right">{b.duplicateLeads}</TableCell>
                      <TableCell><Badge variant="outline">{b.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

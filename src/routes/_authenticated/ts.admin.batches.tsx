import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Upload, Power, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import { CampaignSelector } from "@/components/campaign-selector";
import {
  useBatch,
  useBatchesByCampaign,
  useCampaign,
  useCampaigns,
  useConfirmDuplicates,
  useToggleBatchAvailability,
  useUpdateBatchAgentMax,
  useUploadBatch,
} from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";
import type { AppUser, TSBatchUploadResult } from "@/lib/types";
import { ROLE_TS_AGENT } from "@/lib/permissions";
import { FilterBar, buildRowFilter, type FilterValues } from "@/components/filters/filter-bar";

export const Route = createFileRoute("/_authenticated/ts/admin/batches")({
  component: () => (
    <SectionGuard section="ts:admin">
      <BatchesPage />
    </SectionGuard>
  ),
});

function BatchesPage() {
  const campaigns = useCampaigns();
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid;
  const list = useBatchesByCampaign(activeCid);

  const upload = useUploadBatch();
  const toggleAv = useToggleBatchAvailability();
  const users = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => api<AppUser[]>("/api/users/Get%20All%20Users"),
  });
  const campaign = useCampaign(activeCid);
  const availableAgents = useMemo(() => {
    const inCampaign = new Set((campaign.data?.agents ?? []).filter((a) => a.isActive).map((a) => a.agentId));
    return (users.data ?? []).filter((u) => Number(u.roleId) === ROLE_TS_AGENT && inCampaign.has(u.id));
  }, [users.data, campaign.data]);

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [followUpDays, setFollowUpDays] = useState<string>("");
  const [agentMax, setAgentMax] = useState<Record<number, string>>({});
  const [uploadResult, setUploadResult] = useState<TSBatchUploadResult | null>(null);
  const confirmDup = useConfirmDuplicates();

  const [manageBatchId, setManageBatchId] = useState<number | null>(null);
  const [filters, setFilters] = useState<FilterValues>({});
  const predicate = buildRowFilter<any>(
    filters,
    { dateFrom: (r) => r.uploadedAt, dateTo: (r) => r.uploadedAt },
    [(r) => r.uploadedBy, (r) => String(r.id)],
  );
  const rows = (list.data ?? []).filter(predicate);

  const submit = () => {
    if (!activeCid) return toast.error("Pick a campaign");
    if (!file) return toast.error("Attach an Excel file");
    const agents = Object.entries(agentMax)
      .filter(([, v]) => Number(v) > 0)
      .map(([k, v]) => ({ agentId: Number(k), maxCalls: Number(v) }));
    if (!agents.length) return toast.error("Set max calls for at least one agent");
    upload.mutate(
      {
        campaignId: activeCid,
        file,
        followUpDays: followUpDays ? Number(followUpDays) : undefined,
        agents,
      },
      {
        onSuccess: (r) => {
          setUploadResult(r);
          toast.success(`Batch #${r.batchId} — ${r.validRows} valid, ${r.duplicateRows} duplicates`);
          setOpen(false);
          setFile(null);
          setAgentMax({});
          setFollowUpDays("");
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
          <p className="text-sm text-muted-foreground">Upload lead batches and assign max-calls per agent.</p>
        </div>
        <div className="flex items-center gap-2">
          <CampaignSelector value={activeCid} onChange={setCid} />

          <ExportButton
            rows={rows}
            filename="ts-batches"
            columns={[
              { label: "ID", key: "id" },
              { label: "Total", key: "totalRows" },
              { label: "Valid", key: "validRows" },
              { label: "Duplicates", key: "duplicateRows" },
              { label: "Follow-Up Days", key: "followUpDays" },
              { label: "Uploaded By", key: "uploadedBy" },
              { label: "Uploaded At", key: "uploadedAt" },
            ]}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!activeCid}><Upload className="h-4 w-4 mr-2" /> Upload Batch</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Leads Batch</DialogTitle>
                <DialogDescription>
                  Excel columns: Phone, Full Name, Company, Registration Date, Activation Date.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Excel file</Label>
                  <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <div>
                  <Label>Follow-up days (optional)</Label>
                  <Input type="number" min={0} value={followUpDays} onChange={(e) => setFollowUpDays(e.target.value)} />
                </div>
                <div>
                  <Label>Max calls per agent</Label>
                  <div className="border rounded p-2 mt-1 max-h-56 overflow-y-auto space-y-2">
                    {availableAgents.length ? availableAgents.map((u) => (
                      <div key={u.id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm">{u.fullName}</span>
                        <Input
                          type="number" min={0} className="w-24"
                          value={agentMax[u.id] ?? ""}
                          onChange={(e) => setAgentMax((prev) => ({ ...prev, [u.id]: e.target.value }))}
                        />
                      </div>
                    )) : <div className="text-xs text-muted-foreground">No active agents in this campaign.</div>}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={upload.isPending} onClick={submit}>
                  {upload.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Batches</CardTitle>
          <div className="pt-2">
            <FilterBar fields={["search", "dateFrom", "dateTo"]} values={filters} onChange={setFilters} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Valid</TableHead>
                    <TableHead className="text-right">Duplicates</TableHead>
                    <TableHead>Follow-Up</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">#{b.id}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.uploadedAt ? new Date(b.uploadedAt).toLocaleString() : "—"}
                        {b.uploadedBy && <div className="text-xs">by {b.uploadedBy}</div>}
                      </TableCell>
                      <TableCell className="text-right">{b.totalRows ?? b.totalLeads ?? 0}</TableCell>
                      <TableCell className="text-right">{b.validRows ?? b.processedLeads ?? 0}</TableCell>
                      <TableCell className="text-right">{b.duplicateRows ?? b.duplicateLeads ?? 0}</TableCell>
                      <TableCell>{b.followUpDays ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={b.isAvailable === false ? "outline" : "default"}>
                          {b.isAvailable === false ? "Paused" : "Available"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setManageBatchId(b.id)}>Agents</Button>
                          <Button
                            size="sm" variant="outline"
                            onClick={() =>
                              toggleAv.mutate(
                                { batchId: b.id, isAvailable: !(b.isAvailable !== false) },
                                {
                                  onSuccess: () => { toast.success("Updated"); list.refetch(); },
                                  onError: (e: Error) => toast.error(e.message),
                                },
                              )
                            }
                          >
                            <Power className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!rows.length && (
                    <TableRow><TableCell colSpan={8} className="h-16 text-center text-muted-foreground">No batches</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ManageBatchAgentsDialog batchId={manageBatchId} onClose={() => setManageBatchId(null)} />

      <DuplicatesDialog
        result={uploadResult}
        onClose={() => setUploadResult(null)}
        onConfirm={(leads) =>
          confirmDup.mutate(
            { batchId: uploadResult!.batchId, leads },
            {
              onSuccess: () => { toast.success("Duplicates added"); setUploadResult(null); list.refetch(); },
              onError: (e: Error) => toast.error(e.message),
            },
          )
        }
        pending={confirmDup.isPending}
      />
    </div>
  );
}

function ManageBatchAgentsDialog({ batchId, onClose }: { batchId: number | null; onClose: () => void }) {
  const q = useBatch(batchId ?? undefined);
  const update = useUpdateBatchAgentMax();
  const [edited, setEdited] = useState<Record<number, string>>({});
  return (
    <Dialog open={batchId != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Batch #{batchId} — Agent max calls</DialogTitle></DialogHeader>
        {q.isLoading ? (
          <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(q.data?.agents ?? []).map((a) => (
                  <TableRow key={a.agentId}>
                    <TableCell>{a.agentName ?? `#${a.agentId}`}</TableCell>
                    <TableCell className="text-right">{a.callsUsed ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number" min={0} className="w-24 ml-auto"
                        defaultValue={a.maxCalls}
                        onChange={(e) => setEdited((prev) => ({ ...prev, [a.agentId]: e.target.value }))}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm" variant="outline"
                        disabled={!edited[a.agentId] || Number(edited[a.agentId]) === a.maxCalls || update.isPending}
                        onClick={() =>
                          update.mutate(
                            { batchId: batchId!, agentId: a.agentId, maxCalls: Number(edited[a.agentId]) },
                            {
                              onSuccess: () => { toast.success("Saved"); q.refetch(); },
                              onError: (e: Error) => toast.error(e.message),
                            },
                          )
                        }
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!(q.data?.agents ?? []).length && (
                  <TableRow><TableCell colSpan={4} className="h-16 text-center text-muted-foreground">No agents</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DuplicatesDialog({
  result, onClose, onConfirm, pending,
}: {
  result: TSBatchUploadResult | null;
  onClose: () => void;
  onConfirm: (leads: any[]) => void;
  pending: boolean;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const dups = result?.duplicates ?? [];
  const open = Boolean(result && dups.length);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm duplicates ({dups.length})</DialogTitle>
          <DialogDescription>Select duplicates to add anyway.</DialogDescription>
        </DialogHeader>
        <div className="border rounded max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Phone</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dups.map((d, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(i)}
                      onCheckedChange={(v) => setSelected((prev) => {
                        const s = new Set(prev);
                        if (v) s.add(i); else s.delete(i);
                        return s;
                      })}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{d.phone}</TableCell>
                  <TableCell>{d.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{d.company ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Skip</Button>
          <Button
            disabled={pending || !selected.size}
            onClick={() => onConfirm([...selected].map((i) => dups[i]))}
          >
            {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm {selected.size} duplicate{selected.size === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

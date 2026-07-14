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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Power, Users, Search, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import {
  useAddCampaignAgent,
  useCampaign,
  useCampaigns,
  useCreateCampaign,
  useToggleCampaign,
  useToggleCampaignAgent,
  useUpdateCampaign,
} from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";
import type { AppUser } from "@/lib/types";
import { ROLE_TS_AGENT } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/ts/admin/campaigns")({
  component: () => (
    <SectionGuard section="ts:admin">
      <CampaignsPage />
    </SectionGuard>
  ),
});

function CampaignsPage() {
  const list = useCampaigns();
  const create = useCreateCampaign();
  const toggle = useToggleCampaign();
  const update = useUpdateCampaign();

  const users = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => api<AppUser[]>("/api/users/Get%20All%20Users"),
  });
  const tsAgents = useMemo(
    () => (users.data ?? []).filter((u) => Number(u.roleId) === ROLE_TS_AGENT && u.isActive),
    [users.data],
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  const [manageId, setManageId] = useState<number | null>(null);

  const submit = () => {
    if (!name.trim()) return toast.error("Name required");
    if (selectedAgents.size === 0) return toast.error("Pick at least one agent");
    create.mutate(
      { name, description: description || undefined, agentIds: [...selectedAgents] },
      {
        onSuccess: () => {
          toast.success("Campaign created");
          setCreateOpen(false); setName(""); setDescription(""); setSelectedAgents(new Set());
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  const rows = (list.data ?? []).filter((c) =>
    !search ? true : String(c.name).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Create TeleSales campaigns and manage their agents.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            rows={rows}
            filename="ts-campaigns"
            columns={[
              { label: "ID", key: "id" },
              { label: "Name", key: "name" },
              { label: "Description", key: "description" },
              { label: "Root Form", key: "rootFormId" },
              { label: "Total Agents", key: "totalAgents" },
              { label: "Active Agents", key: "activeAgents" },
              { label: "Active", key: "isActive" },
              { label: "Created By", key: "createdBy" },
              { label: "Created At", key: "createdAt" },
            ]}
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New Campaign</DialogTitle>
                <DialogDescription>
                  After creation, define the Root Form under Forms and set Call Results & Targets.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Description (optional)</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div>
                  <Label>Agents</Label>
                  <div className="max-h-56 overflow-y-auto border rounded p-2 mt-1 space-y-1">
                    {tsAgents.map((u) => (
                      <label key={u.id} className="flex items-center gap-2 p-1 rounded hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={selectedAgents.has(u.id)}
                          onCheckedChange={(v) => {
                            setSelectedAgents((prev) => {
                              const s = new Set(prev);
                              if (v) s.add(u.id); else s.delete(u.id);
                              return s;
                            });
                          }}
                        />
                        <span className="text-sm">{u.fullName}</span>
                      </label>
                    ))}
                    {!tsAgents.length && <div className="text-xs text-muted-foreground p-2">No TS agents available.</div>}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button disabled={create.isPending} onClick={submit}>
                  {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All campaigns</CardTitle>
          <div className="pt-2 relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
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
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Agents (Active/Total)</TableHead>
                    <TableHead>Root Form</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-sm truncate">{c.description || "—"}</TableCell>
                      <TableCell className="text-right">{c.activeAgents ?? 0} / {c.totalAgents ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground">{c.rootFormId ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? "default" : "outline"}>
                          {c.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setManageId(c.id)}>
                            <Users className="h-4 w-4 mr-1" /> Agents
                          </Button>
                          <EditCampaignButton campaign={c} update={update} />
                          <Button size="sm" variant="outline" onClick={() => toggle.mutate(c.id)}>
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ManageAgentsDialog
        campaignId={manageId}
        onClose={() => setManageId(null)}
        candidates={tsAgents}
      />
    </div>
  );
}

function EditCampaignButton({ campaign, update }: { campaign: any; update: any }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description ?? "");
  return (
    <>
      <Button
        size="sm" variant="outline"
        onClick={() => { setName(campaign.name); setDescription(campaign.description ?? ""); setOpen(true); }}
      >
        Edit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={update.isPending}
              onClick={() =>
                update.mutate(
                  { id: campaign.id, name, description: description || undefined },
                  {
                    onSuccess: () => { toast.success("Updated"); setOpen(false); },
                    onError: (e: Error) => toast.error(e.message),
                  },
                )
              }
            >
              {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ManageAgentsDialog({
  campaignId, onClose, candidates,
}: {
  campaignId: number | null;
  onClose: () => void;
  candidates: AppUser[];
}) {
  const q = useCampaign(campaignId ?? undefined);
  const add = useAddCampaignAgent();
  const toggle = useToggleCampaignAgent();
  const [pickId, setPickId] = useState("");
  const already = new Set((q.data?.agents ?? []).map((a) => a.agentId));

  return (
    <Dialog open={campaignId != null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Agents — {q.data?.name}</DialogTitle>
          <DialogDescription>Add or toggle agents on this campaign.</DialogDescription>
        </DialogHeader>
        {q.isLoading ? (
          <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(q.data?.agents ?? []).map((a) => (
                    <TableRow key={a.agentId}>
                      <TableCell>{a.agentName}</TableCell>
                      <TableCell>
                        <Badge variant={a.isActive ? "default" : "outline"}>
                          {a.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm" variant="outline"
                          onClick={() =>
                            toggle.mutate(
                              { campaignId: campaignId!, agentId: a.agentId },
                              {
                                onSuccess: () => toast.success("Toggled"),
                                onError: (e: Error) => toast.error(e.message),
                              },
                            )
                          }
                        >
                          <Power className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!(q.data?.agents ?? []).length && (
                    <TableRow><TableCell colSpan={3} className="h-16 text-center text-muted-foreground">No agents</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label>Add agent</Label>
                <select
                  className="w-full border rounded h-9 px-2 bg-background text-sm"
                  value={pickId}
                  onChange={(e) => setPickId(e.target.value)}
                >
                  <option value="">Select agent...</option>
                  {candidates.filter((u) => !already.has(u.id)).map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
              <Button
                disabled={!pickId || add.isPending}
                onClick={() =>
                  add.mutate(
                    { campaignId: campaignId!, agentId: Number(pickId) },
                    {
                      onSuccess: () => { toast.success("Agent added"); setPickId(""); q.refetch(); },
                      onError: (e: Error) => toast.error(e.message),
                    },
                  )
                }
              >
                <Save className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

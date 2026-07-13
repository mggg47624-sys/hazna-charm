import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { useCampaigns, useCreateCampaign, useToggleCampaign } from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";

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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const submit = () => {
    if (!name.trim()) return toast.error("Name required");
    create.mutate({ name, description, startDate, endDate }, {
      onSuccess: () => {
        toast.success("Campaign created");
        setOpen(false); setName(""); setDescription(""); setStartDate(""); setEndDate("");
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Manage TeleSales campaigns.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            rows={list.data ?? []}
            filename="ts-campaigns"
            columns={[
              { label: "ID", key: "id" },
              { label: "Name", key: "name" },
              { label: "Start", key: "startDate" },
              { label: "End", key: "endDate" },
              { label: "Leads", key: "leadsCount" },
              { label: "Agents", key: "agentsCount" },
              { label: "Progress %", key: "progress" },
              { label: "Active", key: "isActive" },
            ]}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                  <div><Label>End date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
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
        <CardHeader><CardTitle className="text-base">All campaigns</CardTitle></CardHeader>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead className="text-right">Leads</TableHead>
                    <TableHead className="text-right">Agents</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list.data ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.startDate} → {c.endDate}</TableCell>
                      <TableCell className="text-right">{c.leadsCount ?? 0}</TableCell>
                      <TableCell className="text-right">{c.agentsCount ?? 0}</TableCell>
                      <TableCell className="text-right">{c.progress ?? 0}%</TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? "default" : "outline"}>
                          {c.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => toggle.mutate(c.id)}>
                          <Power className="h-4 w-4 mr-2" /> Toggle
                        </Button>
                      </TableCell>
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

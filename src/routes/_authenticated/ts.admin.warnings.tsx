import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Check, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import { useActWarning, useGenerateWarnings, useWarnings } from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";
import { FilterBar, buildRowFilter, type FilterValues } from "@/components/filters/filter-bar";
import type { AppUser, Warning } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ts/admin/warnings")({
  component: () => (
    <SectionGuard section="ts:warnings">
      <WarningsPage />
    </SectionGuard>
  ),
});

const STATUS_LABEL: Record<number, string> = { 1: "Pending", 2: "Replied", 3: "Closed" };

function WarningsPage() {
  const [status, setStatus] = useState<string>("all");
  const statusFilter = status === "all" ? undefined : Number(status);
  const list = useWarnings(statusFilter);
  const gen = useGenerateWarnings();
  const act = useActWarning();

  const users = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => api<AppUser[]>("/api/users/Get%20All%20Users"),
  });
  void users;

  const [genDate, setGenDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [actOpen, setActOpen] = useState<Warning | null>(null);
  const [adminAction, setAdminAction] = useState<1 | 2>(1);
  const [adminNote, setAdminNote] = useState("");

  const [filters, setFilters] = useState<FilterValues>({});
  const predicate = buildRowFilter<Warning>(
    filters,
    { dateFrom: (r) => r.createdAt, dateTo: (r) => r.createdAt },
    [(r) => r.agentName ?? r.targetUserName, (r) => r.reason, (r) => r.campaignName ?? ""],
  );
  const rows = (list.data ?? []).filter(predicate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Warnings</h1>
          <p className="text-sm text-muted-foreground">Auto-generated end-of-day warnings for missed targets.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            rows={rows}
            filename="ts-warnings"
            columns={[
              { label: "ID", key: "id" },
              { label: "Agent", key: "agentName" },
              { label: "Campaign", key: "campaignName" },
              { label: "Reason", key: "reason" },
              { label: "Min Calls", key: "minCalls" },
              { label: "Actual Calls", key: "actualCalls" },
              { label: "Status", key: "status" },
              { label: "Reply", key: "note" },
              { label: "Admin Action", key: "adminAction" },
              { label: "Admin Note", key: "adminNote" },
              { label: "Created At", key: "createdAt" },
            ]}
          />
          <Input
            type="date"
            className="w-44"
            value={genDate}
            onChange={(e) => setGenDate(e.target.value)}
          />
          <Button
            disabled={gen.isPending}
            onClick={() =>
              gen.mutate(genDate, {
                onSuccess: (n) => toast.success(`Generated ${n ?? 0} warnings`),
                onError: (e: Error) => toast.error(e.message),
              })
            }
          >
            {gen.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate for Day
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">All warnings</CardTitle>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="1">Pending</SelectItem>
                <SelectItem value="2">Replied</SelectItem>
                <SelectItem value="3">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-3">
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
                    <TableHead>Agent</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reply</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((w) => {
                    const st = Number(w.status);
                    return (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.agentName ?? w.targetUserName}</TableCell>
                        <TableCell className="text-muted-foreground">{w.campaignName ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground max-w-sm truncate">{w.reason}</TableCell>
                        <TableCell className="text-right text-sm">
                          {w.actualCalls ?? "—"} / {w.minCalls ?? "—"}
                        </TableCell>
                        <TableCell><Badge variant="outline">{STATUS_LABEL[st] ?? String(w.status)}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{w.note ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(w.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {st === 2 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setActOpen(w); setAdminAction(1); setAdminNote(""); }}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" /> Action
                            </Button>
                          )}
                          {st === 3 && (
                            <span className="text-xs text-muted-foreground">
                              {w.adminAction === 1 ? "Approved" : "Rejected"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={actOpen != null} onOpenChange={(o) => !o && setActOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Action on Warning</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <div><strong>Agent:</strong> {actOpen?.agentName ?? actOpen?.targetUserName}</div>
              <div className="text-muted-foreground">Reply: {actOpen?.note ?? "—"}</div>
            </div>
            <div>
              <Label>Decision</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={adminAction === 1 ? "default" : "outline"}
                  onClick={() => setAdminAction(1)}
                >
                  <Check className="h-4 w-4 mr-2" /> Approve
                </Button>
                <Button
                  variant={adminAction === 2 ? "default" : "outline"}
                  onClick={() => setAdminAction(2)}
                >
                  <X className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
            <div>
              <Label>Admin note (optional)</Label>
              <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActOpen(null)}>Cancel</Button>
            <Button
              disabled={act.isPending || !actOpen}
              onClick={() =>
                act.mutate(
                  { id: actOpen!.id, adminAction, adminNote: adminNote || undefined },
                  {
                    onSuccess: () => { toast.success("Warning closed"); setActOpen(null); },
                    onError: (e: Error) => toast.error(e.message),
                  },
                )
              }
            >
              {act.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

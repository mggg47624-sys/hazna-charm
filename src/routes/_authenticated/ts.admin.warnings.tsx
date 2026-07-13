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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, MessageSquare, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import {
  useActWarning, useGenerateWarning, useReplyWarning, useWarnings,
} from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";
import type { AppUser } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ts/admin/warnings")({
  component: () => (
    <SectionGuard section="ts:warnings">
      <WarningsPage />
    </SectionGuard>
  ),
});

const severityTone: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-amber-600",
  high: "text-destructive",
};

function WarningsPage() {
  const list = useWarnings();
  const users = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => api<AppUser[]>("/api/users/Get%20All%20Users"),
  });
  const gen = useGenerateWarning();
  const reply = useReplyWarning();
  const act = useActWarning();

  const [open, setOpen] = useState(false);
  const [targetUserId, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");

  const [replyOpen, setReplyOpen] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Warnings</h1>
          <p className="text-sm text-muted-foreground">Issue and track TS agent warnings.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            rows={list.data ?? []}
            filename="ts-warnings"
            columns={[
              { label: "ID", key: "id" },
              { label: "Agent", key: "targetUserName" },
              { label: "Reason", key: "reason" },
              { label: "Severity", key: "severity" },
              { label: "Status", key: "status" },
              { label: "Created By", key: "createdBy" },
              { label: "Created At", key: "createdAt" },
              { label: "Reply", key: "reply" },
            ]}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Issue Warning</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Warning</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Agent</Label>
                  <Select value={targetUserId} onValueChange={setTarget}>
                    <SelectTrigger><SelectValue placeholder="Select TS Agent" /></SelectTrigger>
                    <SelectContent>
                      {(users.data ?? []).filter((u) => Number(u.roleId) === 5).map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  disabled={!targetUserId || !reason.trim() || gen.isPending}
                  onClick={() => gen.mutate(
                    { targetUserId: Number(targetUserId), reason, severity },
                    {
                      onSuccess: () => {
                        toast.success("Warning issued");
                        setOpen(false); setTarget(""); setReason(""); setSeverity("medium");
                      },
                      onError: (e: Error) => toast.error(e.message),
                    },
                  )}
                >
                  {gen.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Issue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All warnings</CardTitle></CardHeader>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Reply</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(list.data ?? []).map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.targetUserName}</TableCell>
                      <TableCell className="text-muted-foreground max-w-sm truncate">{w.reason}</TableCell>
                      <TableCell><span className={severityTone[w.severity]}>{w.severity}</span></TableCell>
                      <TableCell><Badge variant="outline">{w.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{new Date(w.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{w.reply ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setReplyOpen(w.id); setReplyText(w.reply ?? ""); }}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => act.mutate({ id: w.id, status: "acknowledged" })}>
                            <Check className="h-4 w-4 text-[color:var(--success)]" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => act.mutate({ id: w.id, status: "resolved" })}>
                            <X className="h-4 w-4" />
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

      <Dialog open={replyOpen != null} onOpenChange={(v) => !v && setReplyOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reply to warning</DialogTitle></DialogHeader>
          <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(null)}>Cancel</Button>
            <Button
              disabled={reply.isPending || replyOpen == null}
              onClick={() =>
                reply.mutate(
                  { id: replyOpen!, reply: replyText },
                  {
                    onSuccess: () => { toast.success("Reply saved"); setReplyOpen(null); },
                    onError: (e: Error) => toast.error(e.message),
                  },
                )
              }
            >
              {reply.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

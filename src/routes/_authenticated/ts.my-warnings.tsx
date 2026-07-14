import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { useMyWarnings, useReplyWarning } from "@/lib/ts-api";
import type { Warning } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ts/my-warnings")({
  component: () => (
    <SectionGuard section="ts:my-warnings">
      <MyWarningsPage />
    </SectionGuard>
  ),
});

const STATUS_LABEL: Record<number, string> = { 1: "Pending", 2: "Replied", 3: "Closed" };

function MyWarningsPage() {
  const [status, setStatus] = useState<string>("all");
  const statusFilter = status === "all" ? undefined : Number(status);
  const q = useMyWarnings(statusFilter);
  const [replying, setReplying] = useState<Warning | null>(null);

  const rows = useMemo(() => q.data ?? [], [q.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Warnings</h1>
        <p className="text-sm text-muted-foreground">Warnings issued to you by TS admins.</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Warnings</CardTitle>
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
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !rows.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No warnings 🎉</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>My Reply</TableHead>
                    <TableHead>Admin Action</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((w) => {
                    const st = Number(w.status);
                    return (
                      <TableRow key={w.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(w.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{w.reason}</TableCell>
                        <TableCell className="text-muted-foreground">{w.campaignName ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={st === 1 ? "default" : "outline"}>
                            {st === 3 && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {STATUS_LABEL[st] ?? String(w.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {w.note ?? w.reply ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {w.adminAction === 1 ? "Approved" : w.adminAction === 2 ? "Rejected" : "—"}
                          {w.adminNote && <div className="text-xs">{w.adminNote}</div>}
                        </TableCell>
                        <TableCell className="text-right">
                          {st === 1 && (
                            <Button size="sm" variant="outline" onClick={() => setReplying(w)}>
                              <MessageSquare className="h-3 w-3 mr-1" /> Reply
                            </Button>
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

      <ReplyDialog
        warning={replying}
        onClose={() => setReplying(null)}
        onReplied={() => { setReplying(null); q.refetch(); }}
      />
    </div>
  );
}

function ReplyDialog({
  warning, onClose, onReplied,
}: {
  warning: Warning | null;
  onClose: () => void;
  onReplied: () => void;
}) {
  const [note, setNote] = useState("");
  const mutation = useReplyWarning();
  const open = Boolean(warning);

  const submit = () => {
    if (!warning) return;
    if (!note.trim()) return toast.error("Please enter a reply");
    mutation.mutate(
      { id: warning.id, note: note.trim() },
      {
        onSuccess: () => { toast.success("Reply submitted"); setNote(""); onReplied(); },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setNote(""); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reply to Warning</DialogTitle>
          <DialogDescription>{warning?.reason ?? "Submit your response."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Your reply</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={5} placeholder="Explain..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={mutation.isPending || !note.trim()}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Reply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

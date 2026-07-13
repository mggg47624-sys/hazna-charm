import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

function MyWarningsPage() {
  const q = useMyWarnings();
  const [replying, setReplying] = useState<Warning | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Warnings</h1>
        <p className="text-sm text-muted-foreground">
          Warnings issued to you by TS admins.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Warnings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !q.data?.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No warnings 🎉
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reply</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.data.map((w) => {
                    const replied = Boolean(w.reply);
                    return (
                      <TableRow key={w.id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(w.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{w.reason}</TableCell>
                        <TableCell>{w.severity}</TableCell>
                        <TableCell>
                          {replied ? (
                            <Badge className="bg-[color:var(--success)]/20 text-[color:var(--success)] hover:bg-[color:var(--success)]/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Replied
                            </Badge>
                          ) : (
                            <Badge variant="outline">{w.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[280px]">
                          {w.reply ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {!replied && (
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
        onReplied={() => {
          setReplying(null);
          q.refetch();
        }}
      />
    </div>
  );
}

function ReplyDialog({
  warning,
  onClose,
  onReplied,
}: {
  warning: Warning | null;
  onClose: () => void;
  onReplied: () => void;
}) {
  const [reply, setReply] = useState("");
  const mutation = useReplyWarning();
  const open = Boolean(warning);

  const submit = () => {
    if (!warning) return;
    if (!reply.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    mutation.mutate(
      { id: warning.id, reply: reply.trim() },
      {
        onSuccess: () => {
          toast.success("Reply submitted");
          setReply("");
          onReplied();
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setReply("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reply to Warning</DialogTitle>
          <DialogDescription>
            {warning?.reason
              ? `Warning: ${warning.reason}`
              : "Submit your response."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Your reply</Label>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            placeholder="Explain the situation or acknowledge the warning..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending || !reply.trim()}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Reply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

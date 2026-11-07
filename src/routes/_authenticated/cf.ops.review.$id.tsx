import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { PageHeader, RegistrationDetail } from "@/components/cf/cf-ui";
import { fetchCfOpsQueue, useCfClaim, useCfDecision, useCfOpsRegistration, useCfReasons } from "@/lib/cf-api";
import { cfFieldLabels } from "@/lib/cf-types";

export const Route = createFileRoute("/_authenticated/cf/ops/review/$id")({
  head: () => ({ meta: [
    { title: "Review Registration — Consumer Finance" },
    { name: "description", content: "Review Consumer Finance documents and registration details." },
    { property: "og:title", content: "Review Registration — Consumer Finance" },
    { property: "og:description", content: "Review Consumer Finance documents and registration details." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SectionGuard section="cf:ops"><Page /></SectionGuard>,
});

function Page() {
  const id = Number(Route.useParams().id);
  const navigate = useNavigate();
  const claim = useCfClaim();
  const [claimed, setClaimed] = useState(false);
  const detail = useCfOpsRegistration(id, claimed);
  const reasons = useCfReasons();
  const decide = useCfDecision(id);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [sel, setSel] = useState<number[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    setClaimed(false); setSel([]); setNote("");
    claim.mutate(id, { onSuccess: () => setClaimed(true) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectedReasons = sel.filter((id) => reasons.data?.some((r) => r.id === id));
  const submit = (decision: "approve" | "reject") => {
    if (decision === "reject" && !selectedReasons.length) return;
    decide.mutate({ decision, reasonIds: decision === "reject" ? selectedReasons : [], note: note || undefined }, {
      onSuccess: async () => {
        toast.success(decision === "approve" ? "Approved" : "Rejected");
        setApproveOpen(false); setRejectOpen(false);
        const next = (await fetchCfOpsQueue()).find((q) => q.id !== id);
        navigate(next ? { to: "/cf/ops/review/$id", params: { id: String(next.id) } } : { to: "/cf/ops" });
      },
      onError: (e) => toast.error(e.message),
    });
  };

  if (claim.isError) return <Alert variant="destructive"><AlertDescription>{claim.error.message}</AlertDescription></Alert>;
  if (!claimed || detail.isLoading) return <Loader2 className="mx-auto mt-10 h-6 w-6 animate-spin" />;
  if (!detail.data) return <p className="text-destructive">{detail.error?.message ?? "Not found"}</p>;

  return (
    <div className="space-y-4">
      <PageHeader title="Review registration" subtitle={`#${id}`} actions={
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => setRejectOpen(true)}>Reject</Button>
          <Button onClick={() => setApproveOpen(true)}>Approve</Button>
        </div>} />
      <RegistrationDetail data={detail.data} />

      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Approve this registration?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={decide.isPending} onClick={() => submit("approve")}>Approve</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject registration</DialogTitle></DialogHeader>
          <Card><CardContent className="space-y-2 p-3">
            {(reasons.data ?? []).map((r) => (
              <label key={r.id} className="flex items-start gap-2 text-sm">
                <Checkbox checked={sel.includes(r.id)} onCheckedChange={(c) => setSel((s) => (c ? [...s, r.id] : s.filter((x) => x !== r.id)))} />
                <span className="space-y-1"><span dir="auto" className="block">{r.nameAr}</span><span className="block text-xs text-muted-foreground">Agent can edit: {cfFieldLabels(Array.isArray(r.fields) ? r.fields : []) || "None"}</span></span>
              </label>
            ))}
          </CardContent></Card>
          <Label>Note (optional)</Label>
          <Textarea dir="auto" value={note} onChange={(e) => setNote(e.target.value)} />
          <DialogFooter>
            <Button variant="destructive" disabled={!selectedReasons.length || decide.isPending} onClick={() => submit("reject")}>
              {decide.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

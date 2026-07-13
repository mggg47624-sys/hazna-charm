import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowRight,
  Phone,
  User,
  Building2,
  MapPin,
  Inbox,
  CheckCircle2,
  UserPlus,
  Megaphone,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { SectionGuard } from "@/components/section-guard";
import {
  useActiveCampaigns,
  useAddReferral,
  useTsAgentToday,
  useTsNextLead,
  useTsSubmitCall,
} from "@/lib/ts-api";
import { useCallResults } from "@/lib/lookups";
import type { TSNextLead, TSFormQuestion } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ts/work")({
  component: () => (
    <SectionGuard section="ts:agent">
      <TsWorkPage />
    </SectionGuard>
  ),
});

const ANSWERED_ID = 1;

function TsWorkPage() {
  const qc = useQueryClient();
  const campaigns = useActiveCampaigns();
  const callResults = useCallResults();
  const [campaignId, setCampaignId] = useState<number | undefined>(undefined);
  const [lead, setLead] = useState<TSNextLead | null>(null);
  const [stage, setStage] = useState<"idle" | "active" | "submitted">("idle");
  const [callResultId, setCallResultId] = useState("");
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [notes, setNotes] = useState("");
  const [referralOpen, setReferralOpen] = useState(false);
  const [lastCallId, setLastCallId] = useState<number | null>(null);

  const today = useTsAgentToday();
  const next = useTsNextLead();
  const submit = useTsSubmitCall();
  const referral = useAddReferral();

  const activeCid = campaignId ?? campaigns.data?.[0]?.id;
  const isAnswered = Number(callResultId) === ANSWERED_ID;

  const questions = lead?.form?.questions ?? [];

  const canSubmit = useMemo(() => {
    if (!callResultId) return false;
    if (!isAnswered) return true;
    return questions.every((q) => (q.required ? answers[q.id] != null && answers[q.id] !== "" : true));
  }, [callResultId, isAnswered, answers, questions]);

  const fetchNext = () => {
    if (!activeCid) {
      toast.error("Select a campaign first");
      return;
    }
    next.mutate(activeCid, {
      onSuccess: (data) => {
        if (!data || !data.leadId) {
          toast.info("No leads available");
          setStage("idle");
          setLead(null);
          return;
        }
        setLead(data);
        setStage("active");
        setCallResultId("");
        setAnswers({});
        setNotes("");
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  const onSubmit = () => {
    if (!lead) return;
    submit.mutate(
      {
        leadId: lead.leadId,
        campaignId: lead.campaignId,
        callResultId: Number(callResultId),
        answersJson: isAnswered ? JSON.stringify(answers) : null,
        notes,
      },
      {
        onSuccess: (data) => {
          setLastCallId(data?.callId ?? null);
          setStage("submitted");
          qc.invalidateQueries({ queryKey: ["ts"] });
          toast.success("Call submitted");
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  const s = today.data;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">TeleSales Work Queue</h1>
          <p className="text-sm text-muted-foreground">
            Call assigned leads for the selected campaign
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={referralOpen} onOpenChange={setReferralOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" /> Add Referral
              </Button>
            </DialogTrigger>
            <ReferralDialog
              close={() => setReferralOpen(false)}
              submit={(body) =>
                referral.mutate(body, {
                  onSuccess: () => {
                    toast.success("Referral added to leads");
                    setReferralOpen(false);
                  },
                  onError: (e: Error) => toast.error(e.message),
                })
              }
              pending={referral.isPending}
            />
          </Dialog>

          {stage === "idle" && (
            <Button size="lg" onClick={fetchNext} disabled={next.isPending || !activeCid}>
              {next.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Get Next Lead
            </Button>
          )}
        </div>
      </div>

      {/* Campaign selector */}
      <Card>
        <CardContent className="p-4 flex items-center gap-3 flex-wrap">
          <Megaphone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Campaign</span>
          <Select
            value={activeCid ? String(activeCid) : ""}
            onValueChange={(v) => setCampaignId(Number(v))}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.data?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Today's stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MiniStat label="Total Calls" value={s?.totalCalls ?? 0} />
        <MiniStat label="Answered" value={s?.answeredCalls ?? 0} />
        <MiniStat label="No Answer" value={s?.unansweredCalls ?? 0} />
        <MiniStat label="Wrong Number" value={s?.wrongNumberCalls ?? 0} />
        <MiniStat label="Call Later" value={s?.callLaterCalls ?? 0} />
      </div>

      {stage === "idle" && (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-lg">Ready to start</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Pick a campaign above and click "Get Next Lead" to pull an assigned lead.
            </p>
          </CardContent>
        </Card>
      )}

      {stage === "active" && lead && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg">Lead Information</CardTitle>
                <div className="flex items-center gap-2">
                  {lead.attemptCount > 0 && (
                    <Badge variant="outline">Attempt #{lead.attemptCount + 1}</Badge>
                  )}
                  {lead.campaignName && <Badge>{lead.campaignName}</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={User} label="Customer" value={lead.customerName} />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={
                  <span className="inline-flex items-center gap-2">
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {lead.phone}
                    </a>
                    <CopyButton value={lead.phone} />
                  </span>
                }
              />
              <InfoRow icon={Building2} label="Company" value={lead.companyName || "—"} />
              <InfoRow icon={MapPin} label="City" value={lead.city || "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Call Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm">
                <Select value={callResultId} onValueChange={setCallResultId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select call result..." />
                  </SelectTrigger>
                  <SelectContent>
                    {callResults.data?.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.nameEn || r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {callResultId && !isAnswered && (
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {isAnswered && questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{lead.form.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((q) => (
                  <QuestionField
                    key={q.id}
                    q={q}
                    value={answers[q.id]}
                    onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 sticky bottom-0 bg-background/80 backdrop-blur py-3 -mx-6 px-6 border-t">
            <Button variant="outline" onClick={() => setStage("idle")}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={!canSubmit || submit.isPending}>
              {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Call
            </Button>
          </div>
        </>
      )}

      {stage === "submitted" && lead && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)] flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">Call submitted</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Lead: {lead.customerName} · Call #{lastCallId ?? "—"}
            </p>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStage("idle")}>
                <RotateCw className="h-4 w-4 mr-2" /> Done
              </Button>
              <Button onClick={fetchNext} disabled={next.isPending}>
                {next.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Next Lead
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReferralDialog({
  close,
  submit,
  pending,
}: {
  close: () => void;
  submit: (body: { customerName: string; phone: string; companyName?: string; notes?: string }) => void;
  pending: boolean;
}) {
  const [customerName, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompany] = useState("");
  const [notes, setNotes] = useState("");

  const disabled = !customerName.trim() || !phone.trim();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Referral Lead</DialogTitle>
        <DialogDescription>
          The referral is added to your assigned leads pool for the current campaign.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Customer name</Label>
          <Input value={customerName} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
        </div>
        <div>
          <Label>Company (optional)</Label>
          <Input value={companyName} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div>
          <Label>Notes (optional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={close}>Cancel</Button>
        <Button
          disabled={disabled || pending}
          onClick={() => submit({ customerName, phone, companyName, notes })}
        >
          {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add Referral
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function QuestionField({
  q,
  value,
  onChange,
}: {
  q: TSFormQuestion;
  value: any;
  onChange: (v: any) => void;
}) {
  if (q.questionType === "text") {
    return (
      <div>
        <Label className="text-sm">
          {q.questionText} {q.required && <span className="text-destructive">*</span>}
        </Label>
        <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={2} />
      </div>
    );
  }
  if (q.questionType === "rating") {
    return (
      <div>
        <Label className="text-sm">
          {q.questionText} {q.required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex gap-2 mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button
              key={n}
              type="button"
              variant={value === n ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <Label className="text-sm">
        {q.questionText} {q.required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value ? String(value) : ""} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
        <SelectContent>
          {(q.options ?? []).map((o) => (
            <SelectItem key={o.id} value={String(o.id)}>
              {o.optionText}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
      <div className="h-9 w-9 rounded-lg bg-background border flex items-center justify-center text-muted-foreground shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold leading-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

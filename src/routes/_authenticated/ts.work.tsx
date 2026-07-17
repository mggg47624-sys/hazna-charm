import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Inbox,
  CheckCircle2,
  UserPlus,
  RotateCw,
  PhoneCall,
  PhoneOff,
  Clock,
  ClipboardCheck,
  Calendar,
} from "lucide-react";
import type { ComponentType } from "react";
import { toast } from "sonner";
import { CopyButton } from "@/components/copy-button";
import { SectionGuard } from "@/components/section-guard";
import {
  fetchForm,
  useAddManualLead,
  useCampaigns,
  useTsAgentToday,
  useTsNextLead,
  useTsSubmitCall,
} from "@/lib/ts-api";
import { useCallResults } from "@/lib/lookups";
import type { TSAnswer, TSForm, TSNextLead } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ts/work")({
  component: () => (
    <SectionGuard section="ts:agent">
      <TsWorkPage />
    </SectionGuard>
  ),
});

const CR_ANSWERED = 1;
const CR_NO_ANSWER = 2;
const CR_BUSY = 3;
const CR_WRONG = 4;
const CR_CALL_LATER = 5;
const CR_NOT_INTERESTED = 6;
const NOTE_ONLY_RESULTS = new Set([CR_NO_ANSWER, CR_BUSY, CR_WRONG, CR_CALL_LATER, CR_NOT_INTERESTED]);

function TsWorkPage() {
  const qc = useQueryClient();
  const callResults = useCallResults();
  const primed = qc.getQueryData<TSNextLead>(["ts", "next"]) ?? null;

  const [lead, setLead] = useState<TSNextLead | null>(primed);
  const [stage, setStage] = useState<"idle" | "active" | "submitted">(
    primed ? "active" : "idle",
  );
  const [callResultId, setCallResultId] = useState("");
  const [notes, setNotes] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [lastCallId, setLastCallId] = useState<number | null>(null);

  // Form tree walk state
  const [formStack, setFormStack] = useState<TSForm[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loadingForm, setLoadingForm] = useState(false);
  const [treeComplete, setTreeComplete] = useState(false);

  const today = useTsAgentToday();
  const next = useTsNextLead();
  const submit = useTsSubmitCall();

  const isAnswered = Number(callResultId) === CR_ANSWERED;
  const needsNoteOnly = NOTE_ONLY_RESULTS.has(Number(callResultId));

  // Load the root form when a lead arrives.
  useEffect(() => {
    if (!lead || !lead.formId) return;
    let cancel = false;
    setLoadingForm(true);
    setFormStack([]);
    setAnswers({});
    setTreeComplete(false);
    fetchForm(lead.formId)
      .then((form) => {
        if (!cancel) setFormStack([form]);
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => !cancel && setLoadingForm(false));
    return () => {
      cancel = true;
    };
  }, [lead?.leadId, lead?.formId]);

  // When answered questions in the current form select an option with nextFormId → advance.
  const advanceIfNeeded = async (nextFormId: number | null | undefined) => {
    if (!nextFormId) {
      setTreeComplete(true);
      return;
    }
    setLoadingForm(true);
    try {
      const form = await fetchForm(nextFormId);
      setFormStack((prev) => [...prev, form]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingForm(false);
    }
  };

  const currentForm = formStack[formStack.length - 1];

  // A form is "answered" when every question has an answer.
  const currentFormAnswered = useMemo(() => {
    if (!currentForm) return false;
    return currentForm.questions.every((q) => {
      const v = answers[q.id];
      return v != null && String(v).trim() !== "";
    });
  }, [currentForm, answers]);

  // When the current form is fully answered → figure out next: pick nextFormId of last answered option, else question.nextFormId, else complete.
  useEffect(() => {
    if (!currentForm || !currentFormAnswered || loadingForm) return;
    // determine next form: prefer any option-driven jump
    let nextId: number | null | undefined = undefined;
    for (const q of currentForm.questions) {
      if (q.questionType === 1) {
        const val = answers[q.id];
        const opt = q.options?.find((o) => String(o.id) === String(val));
        if (opt) {
          if (opt.nextFormId != null) {
            nextId = opt.nextFormId;
            break;
          }
        }
      } else if (q.nextFormId != null) {
        nextId = q.nextFormId;
      }
    }
    if (nextId) {
      // Only advance once (avoid loops) — check top of stack differs.
      if (formStack[formStack.length - 1]?.id !== nextId) {
        void advanceIfNeeded(nextId);
      }
    } else {
      setTreeComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFormAnswered]);

  const canSubmit = useMemo(() => {
    if (!callResultId) return false;
    if (!isAnswered) return true;
    // Answered → require form tree completion
    return treeComplete;
  }, [callResultId, isAnswered, treeComplete]);

  const fetchNext = () => {
    qc.removeQueries({ queryKey: ["ts", "next"] });
    next.mutate(undefined, {
      onSuccess: (data) => {
        if (!data || !data.leadId) {
          toast.info("No leads available");
          setStage("idle");
          setLead(null);
          return;
        }
        resetForNewLead(data);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  const resetForNewLead = (data: TSNextLead) => {
    setLead(data);
    setStage("active");
    setCallResultId("");
    setAnswers({});
    setNotes("");
    setFormStack([]);
    setTreeComplete(false);
  };

  const onSubmit = () => {
    if (!lead) return;
    // Build answers JSON from all forms in the stack
    const answersArr: TSAnswer[] = [];
    for (const form of formStack) {
      for (const q of form.questions) {
        const v = answers[q.id];
        if (v == null || v === "") continue;
        let answerValue = String(v);
        if (q.questionType === 1) {
          const opt = q.options?.find((o) => String(o.id) === String(v));
          if (opt) answerValue = opt.optionText;
        }
        answersArr.push({ questionId: q.id, answerValue });
      }
    }
    submit.mutate(
      {
        callAttemptId: lead.callAttemptId,
        callResultId: Number(callResultId),
        answersJson: isAnswered ? JSON.stringify(answersArr) : null,
        notes: notes || undefined,
      },
      {
        onSuccess: (data) => {
          setLastCallId(data?.callAttemptId ?? null);
          setStage("submitted");
          qc.invalidateQueries({ queryKey: ["ts"] });
          toast.success("Call submitted");
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  const s = today.data;

  const campaignsList = useCampaigns();
  const activeCampaigns = (campaignsList.data ?? []).filter((c) => c.isActive);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">TeleSales Work Queue</h1>
          <p className="text-sm text-muted-foreground">
            Call assigned leads and log the outcome
          </p>
          {activeCampaigns.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Your campaign{activeCampaigns.length > 1 ? "s" : ""}:</span>
              {activeCampaigns.map((c) => (
                <Badge key={c.id} variant="secondary">{c.name}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ManualLeadButton
            open={manualOpen}
            setOpen={setManualOpen}
          />
          {stage === "idle" && (
            <Button size="lg" onClick={fetchNext} disabled={next.isPending}>
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


      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Calls" value={s?.totalCalls ?? 0} icon={PhoneCall} tone="primary" />
        <StatCard label="Answered" value={s?.answeredCalls ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard label="No Answer" value={s?.unansweredCalls ?? 0} icon={PhoneOff} tone="muted" />
        <StatCard label="Wrong Number" value={s?.wrongNumberCalls ?? 0} icon={PhoneOff} tone="muted" />
        <StatCard label="Call Later" value={s?.callLaterCalls ?? 0} icon={Clock} tone="muted" />
        <StatCard label="Target" value={`${s?.completedCalls ?? 0} / ${s?.targetCalls ?? "—"}`} icon={ClipboardCheck} tone="primary" />
        <StatCard label="First Call" value={s?.firstCallTime ?? "—"} icon={Clock} tone="muted" />
        <StatCard label="Last Call" value={s?.lastCallTime ?? "—"} icon={Clock} tone="muted" />
        <StatCard label="Avg Call (min)" value={s?.avgCallMinutes != null ? Number(s.avgCallMinutes).toFixed(1) : "—"} icon={ClipboardCheck} tone="primary" />
        <StatCard label="Idle (min)" value={s?.idleMinutes ?? "—"} icon={Clock} tone="muted" />
      </div>

      {stage === "idle" && (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-lg">Ready to start</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Click "Get Next Lead" to pull the next assigned lead.
            </p>
          </CardContent>
        </Card>
      )}

      {stage === "active" && lead && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg">Customer Details</CardTitle>
                <div className="flex items-center gap-2">
                  {lead.attemptCount > 0 && (
                    <Badge variant="outline">Attempt #{lead.attemptCount + 1}</Badge>
                  )}
                  {lead.followUpCount ? (
                    <Badge variant="outline">Follow-up #{lead.followUpCount}</Badge>
                  ) : null}
                  {lead.campaignName && <Badge>{lead.campaignName}</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={User} label="Customer" value={lead.fullName || lead.customerName} />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={
                  <span className="inline-flex items-center gap-2">
                    <span className="text-foreground font-medium">{lead.phone}</span>
                    <CopyButton value={lead.phone} />
                  </span>

                }
              />
              <InfoRow icon={Building2} label="Company" value={lead.company || lead.companyName || "—"} />
              {lead.registrationDate && (
                <InfoRow icon={Calendar} label="Registration" value={new Date(lead.registrationDate).toLocaleDateString()} />
              )}
              {lead.activationDate && (
                <InfoRow icon={Calendar} label="Activation" value={new Date(lead.activationDate).toLocaleDateString()} />
              )}
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
              {callResultId && needsNoteOnly && (
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
              )}
            </CardContent>
          </Card>

          {isAnswered && (
            <>
              {loadingForm && !formStack.length ? (
                <Card>
                  <CardContent className="py-8 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : (
                formStack.map((form, i) => (
                  <Card key={`${form.id}-${i}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {form.name}
                        {form.isRoot && <Badge className="ml-2" variant="outline">Root</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {form.questions.map((q) => (
                        <QuestionField
                          key={q.id}
                          q={q}
                          value={answers[q.id]}
                          onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                        />
                      ))}
                    </CardContent>
                  </Card>
                ))
              )}
              {loadingForm && formStack.length > 0 && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading next form...
                </div>
              )}
              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </>
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
              Lead: {lead.fullName || lead.customerName} · Call #{lastCallId ?? "—"}
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

function ManualLeadButton({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const campaigns = useCampaigns();
  const add = useAddManualLead();
  const [campaignId, setCampaignId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const reset = () => {
    setCampaignId("");
    setFullName("");
    setPhone("");
    setCompany("");
  };

  const submit = () => {
    if (!campaignId) return toast.error("Pick a campaign");
    if (!fullName.trim() || !phone.trim()) return toast.error("Name and phone required");
    add.mutate(
      { campaignId: Number(campaignId), fullName, phone, company: company || undefined },
      {
        onSuccess: () => {
          toast.success("Lead saved");
          reset();
          setOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" /> Add Manual Lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Manual Lead</DialogTitle>
          <DialogDescription>
            The lead is added to your assigned pool and ready for a call.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Campaign</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
              <SelectContent>
                {campaigns.data?.filter((c) => c.isActive).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><Label>Company (optional)</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={add.isPending} onClick={submit}>
            {add.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create & Start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuestionField({
  q,
  value,
  onChange,
}: {
  q: { id: number; questionText: string; questionType: 1 | 2 | 3; options?: any[] };
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  if (q.questionType === 3) {
    // Text
    return (
      <div>
        <Label className="text-sm">{q.questionText} <span className="text-destructive">*</span></Label>
        <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={2} />
      </div>
    );
  }
  if (q.questionType === 2) {
    // Calendar
    return (
      <div>
        <Label className="text-sm">{q.questionText} <span className="text-destructive">*</span></Label>
        <Input type="datetime-local" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  // Options (questionType === 1)
  return (
    <div>
      <Label className="text-sm">{q.questionText} <span className="text-destructive">*</span></Label>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger className="mt-1"><SelectValue placeholder="Choose..." /></SelectTrigger>
        <SelectContent>
          {(q.options ?? []).map((o: any) => (
            <SelectItem key={o.id} value={String(o.id)}>{o.optionText}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
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

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "muted";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
      : tone === "muted"
        ? "bg-muted text-muted-foreground"
        : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${toneClasses}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Keep import used (react-query) even if unused directly
void useQuery;

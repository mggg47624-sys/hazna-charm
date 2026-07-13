import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, type ComponentType, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { NextLead, SubmitCallResp, EvalQuestion } from "@/lib/types";
import { useCallResults } from "@/lib/lookups";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Phone,
  User,
  Building2,
  Tag,
  UserCheck,
  Inbox,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  PhoneOff,
  PhoneCall,
  ClipboardCheck,
  Clock,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { EvaluationForm, type AnswerValue } from "@/components/evaluation-form";
import { useAgentStatsToday, useAgentStatsDaily } from "@/lib/agent-stats";
import { CopyButton } from "@/components/copy-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/qa/work")({
  component: WorkPage,
});

const ANSWERED_ID = 1;

type ApiObject = Record<string, unknown>;
type IconType = ComponentType<{ className?: string }>;

const unwrapArray = (value: unknown): ApiObject[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const obj = value as ApiObject;
  return unwrapArray(obj.$values ?? obj.values ?? obj.items ?? obj.Items ?? obj.data ?? obj.Data);
};

const extractQuestions = (source: unknown): ApiObject[] => {
  if (!source || typeof source !== "object") return [];
  const obj = source as ApiObject;
  const direct = unwrapArray(obj.questions ?? obj.Questions);
  if (direct.length) return direct;
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const nested = extractQuestions(value);
      if (nested.length) return nested;
    }
  }
  return [];
};

const optionalText = (value: unknown) =>
  value === undefined || value === null ? undefined : String(value);

const normalizeQuestions = (source: unknown): EvalQuestion[] =>
  extractQuestions(source).map((q, idx) => ({
    questionId: Number(q.questionId ?? q.QuestionId ?? q.id ?? q.Id ?? idx),
    questionText: optionalText(q.questionText ?? q.QuestionText ?? q.text) ?? "",
    questionTextEn: optionalText(q.questionTextEn ?? q.QuestionTextEn ?? q.textEn),
    questionType: Number(q.questionType ?? q.QuestionType ?? q.type ?? 1) as 1 | 2 | 3,
    hasComment: Number(q.hasComment ?? q.HasComment ?? 0),
    weight: Number(q.weight ?? q.Weight ?? 0),
    sectionId: Number(q.sectionId ?? q.SectionId ?? 0),
    sectionName: optionalText(q.sectionName ?? q.SectionName) ?? "Questions",
    displayOrder: Number(q.displayOrder ?? q.DisplayOrder ?? idx),
  }));

function WorkPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  // Pick up a lead handed off from Call Later (seeded into cache via
  // queryClient.setQueryData(["queue", "next"], lead)).
  const primed = qc.getQueryData<NextLead>(["queue", "next"]) ?? null;
  const [stage, setStage] = useState<"idle" | "active" | "submitted">(
    primed ? "active" : "idle",
  );
  const [lead, setLead] = useState<NextLead | null>(primed);
  const [callResultId, setCallResultId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<SubmitCallResp | null>(null);

  // Clear the primed lead from cache once consumed so a page refresh doesn't
  // silently re-hydrate an already-handled Call Later pickup.
  useEffect(() => {
    if (primed) qc.removeQueries({ queryKey: ["queue", "next"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const callResults = useCallResults();

  // Agent's daily stats — backed by /api/AgentStats (JWT-derived agent).
  const stats = useAgentStatsToday();
  const s = stats.data;
  if (typeof window !== "undefined" && s) {
    // eslint-disable-next-line no-console
    console.debug("[agent-stats/today] keys:", Object.keys(s));
  }
  const todayDate = new Date().toISOString().slice(0, 10);
  const daily = useAgentStatsDaily(todayDate);

  const isAnswered = Number(callResultId) === ANSWERED_ID;

  // Questions are bundled inside the NextLead response (per backend contract).
  const questions: EvalQuestion[] = useMemo(() => {
    if (!lead) return [];
    return lead.questions.length ? lead.questions : normalizeQuestions(lead);
  }, [lead]);

  const fetchNext = useMutation({
    mutationFn: () => api<unknown>("/api/Queue/NextLead"),
    onSuccess: (data) => {
      const item = data && typeof data === "object" ? (data as ApiObject) : null;
      const customerId = item?.customerId ?? item?.CustomerId;
      if (!item || !customerId) {
        setLead(null);
        setStage("idle");
        toast.info("No customers available right now");
        return;
      }
      // Normalize top-level lead fields to camelCase
      const normalized: NextLead = {
        customerId: Number(customerId),
        khaznaId: optionalText(item.khaznaId ?? item.KhaznaId) ?? "",
        customerName: optionalText(item.customerName ?? item.CustomerName) ?? "",
        phone: optionalText(item.phone ?? item.Phone) ?? "",
        companyName: optionalText(item.companyName ?? item.CompanyName),
        customerStatus: optionalText(item.customerStatus ?? item.CustomerStatus),
        transactionType: optionalText(item.transactionType ?? item.TransactionType),
        transactionTypeId: Number(item.transactionTypeId ?? item.TransactionTypeId) || undefined,
        salesRepName: optionalText(item.salesRepName ?? item.SalesRepName),
        salesRepKhaznaId: optionalText(item.salesRepKhaznaId ?? item.SalesRepKhaznaId),
        attemptCount: Number(item.attemptCount ?? item.AttemptCount ?? 0),
        questions: normalizeQuestions(item),
      };
      setLead(normalized);
      setAnswers({});
      setCallResultId("");
      setNotes("");
      setResult(null);
      setStage("active");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = useMutation({
    mutationFn: () => {
      if (!lead) throw new Error("No lead");
      const answersList = Object.values(answers).map((a) => ({
        questionId: a.questionId,
        answerValue: a.answerValue,
        comment: a.comment || "",
      }));
      return api<SubmitCallResp>("/api/Call/Submit", {
        method: "POST",
        body: {
          customerId: lead.customerId,
          callResultId: Number(callResultId),
          answersJson: isAnswered ? JSON.stringify(answersList) : null,
        },
      });
    },
    onSuccess: (data) => {
      setResult(data);
      setStage("submitted");
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["agent-stats"] });
      toast.success("Call submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Clear answers when call result changes
  useEffect(() => {
    setAnswers({});
  }, [callResultId]);

  const canSubmit = useMemo(() => {
    if (!callResultId) return false;
    if (!isAnswered) return true;
    if (!lead) return false;
    if (!questions.length) return false;
    return questions.every((q) => answers[q.questionId]?.answerValue);
  }, [callResultId, isAnswered, lead, answers, questions]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Work Queue</h1>
          <p className="text-sm text-muted-foreground">Call customers and evaluate sales reps</p>
        </div>
        {stage === "idle" && (
          <Button size="lg" onClick={() => fetchNext.mutate()} disabled={fetchNext.isPending}>
            {fetchNext.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Get Next Lead
          </Button>
        )}
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Calls" value={s?.totalCalls ?? 0} icon={PhoneCall} tone="primary" />
        <StatCard label="Answered" value={s?.answeredCalls ?? 0} icon={CheckCircle2} tone="success" />
        <StatCard label="Not Answered" value={s?.unansweredCalls ?? 0} icon={PhoneOff} tone="muted" />
        <StatCard label="Wrong Number" value={s?.wrongNumberCalls ?? 0} icon={PhoneOff} tone="muted" />
        <StatCard label="Call Later" value={s?.callLaterCalls ?? 0} icon={Clock} tone="muted" />
        <StatCard label="Completed Evals" value={s?.completedEvaluations ?? 0} icon={ClipboardCheck} tone="primary" />
        <StatCard label="First Call" value={s?.firstCallTime ?? "—"} icon={Clock} tone="muted" />
        <StatCard label="Last Call" value={s?.lastCallTime ?? "—"} icon={Clock} tone="muted" />
        <StatCard label="Avg Lead (min)" value={s?.avgLeadDurationMinutes != null ? Number(s.avgLeadDurationMinutes).toFixed(1) : "—"} icon={Clock} tone="primary" />
        <StatCard label="Working (min)" value={s?.totalWorkingMinutes ?? "—"} icon={Clock} tone="primary" />
      </div>

      {stage === "idle" && daily.data && daily.data.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Today's Calls</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khazna ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Duration (min)</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daily.data.map((r) => (
                    <TableRow key={r.callId}>
                      <TableCell className="font-medium">{r.khaznaId || "—"}</TableCell>
                      <TableCell>{r.customerName || "—"}</TableCell>
                      <TableCell>{r.callResult || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.startTime || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.endTime || "—"}</TableCell>
                      <TableCell className="text-right">{r.durationMinutes != null ? Number(r.durationMinutes).toFixed(1) : "—"}</TableCell>
                      <TableCell className="text-right">{r.totalScore != null ? Number(r.totalScore).toFixed(2) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === "idle" && (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-lg">Ready to start</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Click "Get Next Lead" to pull the next customer from the queue.
            </p>
          </CardContent>
        </Card>
      )}

      {stage === "active" && lead && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg">Customer Information</CardTitle>
                <div className="flex items-center gap-2">
                  {lead.attemptCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-warning-foreground bg-[color:var(--warning)]/20"
                    >
                      Attempt #{lead.attemptCount + 1}
                    </Badge>
                  )}
                  {lead.transactionType && <Badge>{lead.transactionType}</Badge>}
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
              <InfoRow icon={Tag} label="Khazna ID" value={lead.khaznaId} />
              <InfoRow icon={UserCheck} label="Sales Rep" value={lead.salesRepName || "—"} />
              <InfoRow icon={Tag} label="Status" value={lead.customerStatus || "—"} />
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
                    placeholder="Add notes about this call..."
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {isAnswered && (
            <>
              {!questions.length && (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    No evaluation questions returned for this lead's transaction type.
                  </CardContent>
                </Card>
              )}
              {questions.length > 0 && (
                <EvaluationForm
                  questions={questions}
                  value={answers}
                  onChange={(list) => {
                    const map: Record<number, AnswerValue> = {};
                    list.forEach((a) => (map[a.questionId] = a));
                    setAnswers(map);
                  }}
                />
              )}
            </>
          )}

          <div className="flex justify-end gap-2 sticky bottom-0 bg-background/80 backdrop-blur py-3 -mx-6 px-6 border-t">
            <Button variant="outline" onClick={() => setStage("idle")}>
              Cancel
            </Button>
            <Button onClick={() => submit.mutate()} disabled={!canSubmit || submit.isPending}>
              {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Call
            </Button>
          </div>
        </>
      )}

      {stage === "submitted" && result && lead && (
        <Card>
          <CardContent className="py-10 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-[color:var(--success)]/15 text-[color:var(--success)] flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">Call submitted</h3>
            <p className="text-sm text-muted-foreground mt-1">Customer: {lead.customerName}</p>
            {result.totalScore !== null && (
              <div className="mt-6 inline-flex flex-col items-center bg-primary/5 border border-primary/20 rounded-2xl px-10 py-6">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Evaluation Score
                </span>
                <span className="text-5xl font-bold text-primary mt-2">
                  {result.totalScore.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground mt-1">out of 5.00</span>
              </div>
            )}
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setStage("idle")}>
                <RotateCw className="h-4 w-4 mr-2" /> Done
              </Button>
              <Button onClick={() => fetchNext.mutate()} disabled={fetchNext.isPending}>
                {fetchNext.isPending ? (
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

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: ReactNode;
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

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: IconType;
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

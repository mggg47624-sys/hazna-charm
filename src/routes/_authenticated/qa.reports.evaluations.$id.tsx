import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import { ArrowLeft, Award, CheckSquare, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvalAnswer {
  questionId?: number;
  questionText: string;
  questionTextEn?: string;
  questionType?: 1 | 2 | 3;
  answerValue: string;
  comment?: string;
  scoreGiven: number;
  weight: number;
  sectionId?: number;
  sectionName?: string;
  displayOrder?: number;
}

interface EvalDetail {
  evaluationId: number;
  totalScore: number;
  evaluatedAt: string;
  formName?: string;
  agentName?: string;
  customerName?: string;
  khaznaId?: string;
  transactionType?: string;
  salesRepName?: string;
  teamLeaderName?: string;
  callResult?: string;
  answers: EvalAnswer[];
}

export const Route = createFileRoute("/_authenticated/qa/reports/evaluations/$id")({
  component: EvaluationDetail,
});

function EvaluationDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", "evaluations", id],
    queryFn: () => api<EvalDetail>(`/api/Report/Evaluations/${id}`),
  });

  return (
    <SectionGuard section="qa:reports">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/qa/reports/evaluations">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Evaluations
          </Link>
        </Button>

        {isLoading ? (
          <Card><CardContent className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-primary" /></CardContent></Card>
        ) : error ? (
          <Card><CardContent className="py-10 text-center text-destructive">{(error as Error).message}</CardContent></Card>
        ) : !data ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Evaluation not found.</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{data.formName || "Evaluation"} · #{data.evaluationId}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <Field label="Date" value={String(data.evaluatedAt || "").slice(0, 16).replace("T", " ")} />
                <Field label="Customer" value={data.customerName} />
                <Field label="Khazna ID" value={data.khaznaId} mono />
                <Field label="Transaction" value={data.transactionType} />
                <Field label="Sales Rep" value={data.salesRepName} />
                <Field label="Team Leader" value={data.teamLeaderName} />
                <Field label="QA Agent" value={data.agentName} />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Call Result</div>
                  <Badge variant="secondary">{data.callResult || "—"}</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KpiCard label="Total Score" value={Number(data.totalScore || 0).toFixed(2)} icon={Award} tone="success" hint="out of 5.00" />
              <KpiCard label="Questions" value={data.answers?.length || 0} icon={CheckSquare} />
            </div>

            <AnswersForm answers={data.answers || []} />
          </>
        )}
      </div>
    </SectionGuard>
  );
}

function AnswersForm({ answers }: { answers: EvalAnswer[] }) {
  if (!answers.length) {
    return (
      <Card><CardContent className="py-10 text-center text-muted-foreground">No answers recorded for this evaluation.</CardContent></Card>
    );
  }

  const grouped = Array.from(
    answers.reduce((m, a, i) => {
      const key = a.sectionId ?? -1;
      if (!m.has(key)) m.set(key, { name: a.sectionName || "Answers", items: [] as Array<EvalAnswer & { _i: number }> });
      m.get(key)!.items.push({ ...a, _i: i });
      return m;
    }, new Map<number, { name: string; items: Array<EvalAnswer & { _i: number }> }>()),
  ).map(([sid, v]) => ({ sid, ...v }));

  return (
    <div className="space-y-4">
      {grouped.map((sec) => (
        <Card key={sec.sid} className="overflow-hidden">
          <div className="bg-muted/40 border-b px-5 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm">{sec.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {sec.items.length} question{sec.items.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <CardContent className="p-5 space-y-6">
            {sec.items
              .sort((a, b) => (a.displayOrder ?? a._i) - (b.displayOrder ?? b._i))
              .map((a) => <AnswerBlock key={a._i} a={a} />)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AnswerBlock({ a }: { a: EvalAnswer }) {
  const qType = a.questionType ?? guessType(a.answerValue);
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <label className="text-sm font-medium leading-snug">
          {a.questionText}
          {a.questionTextEn && (
            <span className="block text-xs text-muted-foreground font-normal">{a.questionTextEn}</span>
          )}
        </label>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className="text-xs">{Number(a.weight || 0)}%</Badge>
          <Badge className="text-xs">Score {Number(a.scoreGiven || 0).toFixed(2)}</Badge>
        </div>
      </div>

      {qType === 1 ? (
        <div className="flex flex-wrap gap-2">
          {["Yes", "Partly", "No"].map((opt) => {
            const selected = a.answerValue === opt;
            return (
              <div
                key={opt}
                className={cn(
                  "px-3 py-1.5 rounded-md border text-sm",
                  selected && opt === "Yes" && "bg-[color:var(--success)] text-white border-transparent",
                  selected && opt === "Partly" && "bg-[color:var(--warning)] text-[color:var(--warning-foreground)] border-transparent",
                  selected && opt === "No" && "bg-destructive text-destructive-foreground border-transparent",
                  !selected && "text-muted-foreground",
                )}
              >
                {opt}
              </div>
            );
          })}
        </div>
      ) : qType === 2 ? (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = String(a.answerValue) === String(n);
            return (
              <div
                key={n}
                className={cn(
                  "w-10 h-9 rounded-md border text-sm flex items-center justify-center",
                  selected ? "bg-primary text-primary-foreground border-transparent" : "text-muted-foreground",
                )}
              >
                {n}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">
          {a.answerValue || <span className="text-muted-foreground">—</span>}
        </div>
      )}

      {a.comment && (
        <div className="flex items-start gap-2 text-sm rounded-md border bg-background px-3 py-2">
          <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
          <span className="whitespace-pre-wrap">{a.comment}</span>
        </div>
      )}
    </div>
  );
}

function guessType(v: string): 1 | 2 | 3 {
  if (["Yes", "No", "Partly"].includes(v)) return 1;
  if (/^[1-5]$/.test(String(v ?? ""))) return 2;
  return 3;
}

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value || "—"}</div>
    </div>
  );
}

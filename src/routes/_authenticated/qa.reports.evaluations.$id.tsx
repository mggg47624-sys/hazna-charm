import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Award, CheckSquare, Loader2 } from "lucide-react";

interface EvalAnswer {
  questionText: string;
  questionTextEn?: string;
  answerValue: string;
  scoreGiven: number;
  weight: number;
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
          <Card>
            <CardContent className="py-10 text-center">
              <Loader2 className="h-5 w-5 animate-spin inline text-primary" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-10 text-center text-destructive">
              {(error as Error).message}
            </CardContent>
          </Card>
        ) : !data ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Evaluation not found.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {data.formName || "Evaluation"} · #{data.evaluationId}
                </CardTitle>
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
              <KpiCard
                label="Total Score"
                value={Number(data.totalScore || 0).toFixed(2)}
                icon={Award}
                tone="success"
                hint="out of 5.00"
              />
              <KpiCard label="Questions" value={data.answers?.length || 0} icon={CheckSquare} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Question</TableHead>
                        <TableHead>Answer</TableHead>
                        <TableHead className="text-right">Weight</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data.answers || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No answers
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.answers.map((a, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div>{a.questionText}</div>
                              {a.questionTextEn && (
                                <div className="text-xs text-muted-foreground">{a.questionTextEn}</div>
                              )}
                            </TableCell>
                            <TableCell>{a.answerValue}</TableCell>
                            <TableCell className="text-right">{Number(a.weight || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {Number(a.scoreGiven || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SectionGuard>
  );
}

function Field({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value || "—"}</div>
    </div>
  );
}

import { useState } from "react";
import type { EvalQuestion } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export interface AnswerValue {
  questionId: number;
  answerValue: string;
  comment: string;
}

interface Props {
  questions: EvalQuestion[];
  onChange: (answers: AnswerValue[]) => void;
  value: Record<number, AnswerValue>;
}

export function EvaluationForm({ questions, onChange, value }: Props) {
  const sections = Array.from(
    questions.reduce((m, q) => {
      if (!m.has(q.sectionId)) m.set(q.sectionId, { name: q.sectionName, items: [] as EvalQuestion[] });
      m.get(q.sectionId)!.items.push(q);
      return m;
    }, new Map<number, { name: string; items: EvalQuestion[] }>()),
  ).map(([id, v]) => ({ id, ...v }));

  const update = (q: EvalQuestion, patch: Partial<AnswerValue>) => {
    const next = { ...value };
    const existing = next[q.questionId] || { questionId: q.questionId, answerValue: "", comment: "" };
    next[q.questionId] = { ...existing, ...patch, questionId: q.questionId };
    onChange(Object.values(next));
  };

  return (
    <div className="space-y-6">
      {sections.map((sec) => (
        <Card key={sec.id} className="overflow-hidden">
          <div className="bg-muted/40 border-b px-5 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm">{sec.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {sec.items.length} question{sec.items.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <CardContent className="p-5 space-y-6">
            {sec.items
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((q) => {
                const v = value[q.questionId];
                const showComment =
                  q.hasComment === 1 &&
                  ((q.questionType === 1 && v?.answerValue && v.answerValue !== "Yes") ||
                    (q.questionType === 2 && v?.answerValue && Number(v.answerValue) <= 3));
                return (
                  <div key={q.questionId} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <label className="text-sm font-medium leading-snug">
                        {q.questionTextEn || q.questionText}
                      </label>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {q.weight}%
                      </Badge>
                    </div>
                    {q.questionType === 1 && (
                      <div className="flex gap-2">
                        {["Yes", "Partly", "No"].map((opt) => (
                          <Button
                            key={opt}
                            type="button"
                            size="sm"
                            variant={v?.answerValue === opt ? "default" : "outline"}
                            className={cn(
                              v?.answerValue === opt && opt === "No" && "bg-destructive hover:bg-destructive/90",
                              v?.answerValue === opt && opt === "Partly" && "bg-[color:var(--warning)] text-[color:var(--warning-foreground)] hover:opacity-90",
                              v?.answerValue === opt && opt === "Yes" && "bg-[color:var(--success)] hover:opacity-90",
                            )}
                            onClick={() => update(q, { answerValue: opt })}
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    )}
                    {q.questionType === 2 && (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Button
                            key={n}
                            type="button"
                            size="sm"
                            variant={v?.answerValue === String(n) ? "default" : "outline"}
                            className="w-10"
                            onClick={() => update(q, { answerValue: String(n) })}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                v?.answerValue === String(n) ? "fill-current" : "",
                              )}
                            />
                            <span className="ml-1">{n}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                    {q.questionType === 3 && (
                      <Textarea
                        rows={3}
                        value={v?.answerValue || ""}
                        onChange={(e) => update(q, { answerValue: e.target.value })}
                        placeholder="Type your answer..."
                      />
                    )}
                    {showComment && (
                      <Textarea
                        rows={2}
                        value={v?.comment || ""}
                        onChange={(e) => update(q, { comment: e.target.value })}
                        placeholder="Add a comment (optional but recommended)..."
                        className="mt-2"
                      />
                    )}
                  </div>
                );
              })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2, Plus, Trash2, Edit3, ChevronRight, Save,
} from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { CampaignSelector } from "@/components/campaign-selector";
import {
  useCampaigns,
  useCreateForm,
  useCreateOption,
  useCreateQuestion,
  useDeleteForm,
  useDeleteOption,
  useDeleteQuestion,
  useForm,
  useFormsByCampaign,
  useUpdateForm,
  useUpdateOption,
  useUpdateQuestion,
} from "@/lib/ts-api";
import type { TSFormQuestion, TSQuestionType } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ts/admin/forms")({
  component: () => (
    <SectionGuard section="ts:admin-forms">
      <Page />
    </SectionGuard>
  ),
});

const QTYPE_LABEL: Record<TSQuestionType, string> = { 1: "Options", 2: "Calendar", 3: "Text" };

function Page() {
  const campaigns = useCampaigns();
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid;
  const formsQ = useFormsByCampaign(activeCid);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  useMemo(() => {
    if (!selectedFormId && formsQ.data?.length) setSelectedFormId(formsQ.data[0].id);
  }, [formsQ.data, selectedFormId]);

  const createForm = useCreateForm();
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormRoot, setNewFormRoot] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Forms (Tree)</h1>
          <p className="text-sm text-muted-foreground">
            Design the question tree: Options with per-choice branching, Calendar or Text leaves.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <CampaignSelector value={activeCid} onChange={(v) => { setCid(v); setSelectedFormId(null); }} />
          <Dialog open={newFormOpen} onOpenChange={setNewFormOpen}>
            <DialogTrigger asChild>
              <Button disabled={!activeCid}><Plus className="h-4 w-4 mr-2" /> New Form</Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader><DialogTitle>New Form</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={newFormName} onChange={(e) => setNewFormName(e.target.value)} /></div>
                <label className="flex items-center gap-2">
                  <Checkbox checked={newFormRoot} onCheckedChange={(v) => setNewFormRoot(Boolean(v))} />
                  <span className="text-sm">Root form (first shown to agents)</span>
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewFormOpen(false)}>Cancel</Button>
                <Button
                  disabled={!newFormName.trim() || createForm.isPending}
                  onClick={() =>
                    createForm.mutate(
                      { campaignId: activeCid!, name: newFormName, isRoot: newFormRoot },
                      {
                        onSuccess: (f) => {
                          toast.success("Form created");
                          setNewFormOpen(false);
                          setNewFormName(""); setNewFormRoot(false);
                          setSelectedFormId(f.id);
                        },
                        onError: (e: Error) => toast.error(e.message),
                      },
                    )
                  }
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Forms</CardTitle></CardHeader>
          <CardContent className="p-2">
            {formsQ.isLoading ? (
              <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : !formsQ.data?.length ? (
              <div className="text-sm text-muted-foreground p-4">No forms yet.</div>
            ) : (
              <div className="space-y-1">
                {formsQ.data.map((f) => (
                  <FormRow
                    key={f.id}
                    f={f}
                    selected={selectedFormId === f.id}
                    onSelect={() => setSelectedFormId(f.id)}
                    onDeleted={() => {
                      if (selectedFormId === f.id) setSelectedFormId(null);
                      formsQ.refetch();
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          {selectedFormId ? (
            <FormEditor formId={selectedFormId} allForms={(formsQ.data ?? []).map((f) => ({ id: f.id, name: f.name }))} />
          ) : (
            <div className="text-sm text-muted-foreground">Select a form to edit.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormEditor({ formId, allForms }: { formId: number; allForms: Array<{ id: number; name: string }> }) {
  const form = useForm(formId);
  const update = useUpdateForm();
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  useMemo(() => { if (form.data) setName(form.data.name); }, [form.data]);

  const createQ = useCreateQuestion();
  const createOpt = useCreateOption();
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<TSQuestionType | "yesno">(1);


  if (form.isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!form.data) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {editingName ? (
            <>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-sm" />
              <Button
                size="sm" onClick={() => update.mutate(
                  { id: formId, name },
                  { onSuccess: () => { toast.success("Renamed"); setEditingName(false); form.refetch(); } },
                )}
              ><Save className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Cancel</Button>
            </>
          ) : (
            <>
              <CardTitle>{form.data.name}</CardTitle>
              {form.data.isRoot && <Badge variant="outline">Root</Badge>}
              <Button size="sm" variant="ghost" onClick={() => setEditingName(true)}><Edit3 className="h-3 w-3" /></Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {form.data.questions.map((q) => (
          <QuestionCard key={q.id} q={q} allForms={allForms} onChange={() => form.refetch()} />
        ))}

        <div className="border rounded p-3 space-y-3">
          <div className="text-sm font-medium">Add Question</div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2">
            <Input placeholder="Question text" value={newText} onChange={(e) => setNewText(e.target.value)} />
            <Select value={newType === "yesno" ? "yesno" : String(newType)} onValueChange={(v) => setNewType(v === "yesno" ? ("yesno" as any) : (Number(v) as TSQuestionType))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Options (multiple choice)</SelectItem>
                <SelectItem value="yesno">Yes / No</SelectItem>
                <SelectItem value="2">Calendar (date)</SelectItem>
                <SelectItem value="3">Text</SelectItem>
              </SelectContent>
            </Select>
            <Button
              disabled={!newText.trim() || createQ.isPending || createOpt.isPending}
              onClick={async () => {
                const isYesNo = (newType as any) === "yesno";
                const qType: TSQuestionType = isYesNo ? 1 : (newType as TSQuestionType);
                try {
                  const newId = await createQ.mutateAsync({
                    formId,
                    questionText: newText,
                    questionType: qType,
                    displayOrder: form.data!.questions.length + 1,
                  });
                  if (isYesNo && typeof newId === "number") {
                    await createOpt.mutateAsync({ questionId: newId, optionText: "Yes", nextFormId: null, displayOrder: 1 });
                    await createOpt.mutateAsync({ questionId: newId, optionText: "No", nextFormId: null, displayOrder: 2 });
                  }
                  toast.success("Question added");
                  setNewText("");
                  form.refetch();
                } catch (e: any) {
                  toast.error(e?.message ?? "Failed to add question");
                }
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Options: each choice can branch to another form. Yes/No: shortcut for a 2-option question. Calendar / Text: leaf answers.
          </p>
        </div>

      </CardContent>
    </Card>
  );
}

function QuestionCard({
  q, allForms, onChange,
}: {
  q: TSFormQuestion;
  allForms: Array<{ id: number; name: string }>;
  onChange: () => void;
}) {
  const del = useDeleteQuestion();
  const upd = useUpdateQuestion();
  const createOpt = useCreateOption();
  const updOpt = useUpdateOption();
  const delOpt = useDeleteOption();
  const [text, setText] = useState(q.questionText);
  const [nextFormId, setNextFormId] = useState(q.nextFormId ?? 0);
  const [optText, setOptText] = useState("");
  const [optNext, setOptNext] = useState<number>(0);

  return (
    <div className="border rounded p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Badge>{QTYPE_LABEL[q.questionType]}</Badge>
        <Input value={text} onChange={(e) => setText(e.target.value)} className="flex-1" />
        {q.questionType !== 1 && (
          <Select value={String(nextFormId ?? 0)} onValueChange={(v) => setNextFormId(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">End of tree</SelectItem>
              {allForms.filter((f) => f.id !== q.formId).map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>→ {f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          size="sm" variant="outline"
          disabled={upd.isPending}
          onClick={() =>
            upd.mutate(
              { id: q.id, questionText: text, questionType: q.questionType, nextFormId: nextFormId || null, displayOrder: q.displayOrder },
              { onSuccess: () => { toast.success("Saved"); onChange(); }, onError: (e: Error) => toast.error(e.message) },
            )
          }
        ><Save className="h-3 w-3" /></Button>
        <Button
          size="sm" variant="ghost"
          onClick={() => del.mutate(q.id, { onSuccess: () => { toast.success("Deleted"); onChange(); } })}
        ><Trash2 className="h-3 w-3 text-destructive" /></Button>
      </div>

      {q.questionType === 1 && (
        <div className="pl-6 space-y-2">
          {(q.options ?? []).map((o) => (
            <OptionRow key={o.id} o={o} allForms={allForms} onChange={onChange} updOpt={updOpt} delOpt={delOpt} />
          ))}
          <div className="flex items-center gap-2">
            <Input placeholder="New option..." value={optText} onChange={(e) => setOptText(e.target.value)} />
            <Select value={String(optNext)} onValueChange={(v) => setOptNext(Number(v))}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Next form" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">End</SelectItem>
                {allForms.filter((f) => f.id !== q.formId).map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>→ {f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!optText.trim() || createOpt.isPending}
              onClick={() =>
                createOpt.mutate(
                  { questionId: q.id, optionText: optText, nextFormId: optNext || null, displayOrder: (q.options?.length ?? 0) + 1 },
                  { onSuccess: () => { setOptText(""); setOptNext(0); onChange(); toast.success("Option added"); } },
                )
              }
            ><Plus className="h-3 w-3" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

function OptionRow({ o, allForms, onChange, updOpt, delOpt }: any) {
  const [text, setText] = useState(o.optionText);
  const [next, setNext] = useState<number>(o.nextFormId ?? 0);
  return (
    <div className="flex items-center gap-2">
      <Input value={text} onChange={(e) => setText(e.target.value)} className="flex-1" />
      <Select value={String(next)} onValueChange={(v) => setNext(Number(v))}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="0">End</SelectItem>
          {allForms.map((f: any) => (
            <SelectItem key={f.id} value={String(f.id)}>→ {f.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm" variant="outline"
        onClick={() => updOpt.mutate(
          { id: o.id, optionText: text, nextFormId: next || null, displayOrder: o.displayOrder },
          { onSuccess: () => { toast.success("Saved"); onChange(); } },
        )}
      ><Save className="h-3 w-3" /></Button>
      <Button
        size="sm" variant="ghost"
        onClick={() => delOpt.mutate(o.id, { onSuccess: () => { toast.success("Deleted"); onChange(); } })}
      ><Trash2 className="h-3 w-3 text-destructive" /></Button>
    </div>
  );
}

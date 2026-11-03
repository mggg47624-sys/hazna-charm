import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Maximize2, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { CF_FILE_SLOTS, CF_STATUS_LABEL, type CfFile, type CfRegistrationDetail } from "@/lib/cf-types";
import { cn } from "@/lib/utils";

export const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : "—");
export const fmtDateTime = (v?: string | null) => (v ? new Date(v).toLocaleString() : "—");

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatusBadge({ status }: { status: number }) {
  const cls =
    status === 2 ? "bg-[color:var(--success)]/15 text-[color:var(--success)]"
    : status === 3 ? "bg-destructive/15 text-destructive"
    : "bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]";
  return <Badge variant="outline" className={cn("border-transparent", cls)}>{CF_STATUS_LABEL[status] ?? "—"}</Badge>;
}

export function DecisionBadge({ decision }: { decision: string }) {
  return <StatusBadge status={decision === "approve" ? 2 : 3} />;
}

export interface CfColumn<T> { key: string; header: string; render?: (r: T) => ReactNode; sort?: (r: T) => string | number }

/** Sortable table + server-side pager. */
export function CfTable<T>({
  rows, columns, loading, page, total, pageSize = 10, onPage, rowKey, empty = "No data found",
}: {
  rows: T[]; columns: CfColumn<T>[]; loading?: boolean; page?: number; total?: number; pageSize?: number;
  onPage?: (p: number) => void; rowKey: (r: T) => string | number; empty?: string;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col || !sort) return rows;
    const get = col.sort ?? ((r: T) => (r as any)[col.key]);
    return [...rows].sort((a, b) => (get(a) > get(b) ? 1 : get(a) < get(b) ? -1 : 0) * sort.dir);
  }, [rows, sort, columns]);
  const pages = Math.max(1, Math.ceil((total ?? rows.length) / pageSize));
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>
                  <button className="inline-flex items-center gap-1" onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 1 ? -1 : 1 }))}>
                    {c.header}<ArrowUpDown className="h-3 w-3 opacity-50" />
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            ) : !sorted.length ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">{empty}</TableCell></TableRow>
            ) : sorted.map((r) => (
              <TableRow key={rowKey(r)}>
                {columns.map((c) => <TableCell key={c.key}>{c.render ? c.render(r) : String((r as any)[c.key] ?? "—")}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {onPage && pages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t p-3 text-sm">
          <Button size="icon" variant="outline" disabled={(page ?? 1) <= 1} onClick={() => onPage((page ?? 1) - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span>Page {page ?? 1} / {pages}</span>
          <Button size="icon" variant="outline" disabled={(page ?? 1) >= pages} onClick={() => onPage((page ?? 1) + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </Card>
  );
}

/** Tabs + zoom + rotate + fullscreen viewer for the 6 registration images. */
export function ImageViewer({ files }: { files: CfFile[] }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [full, setFull] = useState(false);
  const slots = CF_FILE_SLOTS.map((s) => ({ ...s, url: files.find((f) => f.type === s.type)?.url }));
  const cur = slots[idx];
  const select = (i: number) => { setIdx(i); setZoom(1); setRot(0); };
  const img = (cls: string) => cur.url
    ? <img src={cur.url} alt={cur.label} className={cls} style={{ transform: `scale(${zoom}) rotate(${rot}deg)`, transition: "transform .2s" }} />
    : <p className="text-sm text-muted-foreground">No image</p>;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{cur.label}</CardTitle>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => setZoom((z) => Math.min(4, z + 0.25))} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => setRot((r) => (r + 90) % 360)} aria-label="Rotate"><RotateCw className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={() => setFull(true)} aria-label="Fullscreen"><Maximize2 className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-80 items-center justify-center overflow-auto rounded-md bg-muted">{img("max-h-80 object-contain")}</div>
        <div className="grid grid-cols-6 gap-2">
          {slots.map((s, i) => (
            <button key={s.type} onClick={() => select(i)} title={s.label}
              className={cn("aspect-square overflow-hidden rounded border-2 bg-muted", i === idx ? "border-primary" : "border-transparent")}>
              {s.url && <img src={s.url} alt={s.label} className="h-full w-full object-cover" />}
            </button>
          ))}
        </div>
      </CardContent>
      <Dialog open={full} onOpenChange={setFull}>
        <DialogContent className="max-w-[95vw] h-[90vh]">
          <DialogTitle>{cur.label}</DialogTitle>
          <div className="flex flex-1 items-center justify-center overflow-auto">{img("max-h-[75vh] object-contain")}</div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const digits = (s?: string) => (s ?? "").replace(/\D/g, "");

/** Shared read-only registration view for Ops review & Admin detail. */
export function RegistrationDetail({ data }: { data: CfRegistrationDetail }) {
  const { list, entered } = data;
  const rows: { label: string; list: ReactNode; entered: ReactNode; mismatch?: boolean }[] = [
    { label: "National ID", list: list.nationalId, entered: list.nationalId },
    { label: "Customer name", list: <span dir="auto">{list.customerName}</span>, entered: "—" },
    { label: "Mobile", list: list.contactNumber, entered: entered.khaznaMobile, mismatch: digits(list.contactNumber) !== digits(entered.khaznaMobile) },
    { label: "ID expiration", list: fmtDate(list.idExpirationDate), entered: fmtDate(entered.idExpirationDate), mismatch: String(list.idExpirationDate).slice(0, 10) !== String(entered.idExpirationDate).slice(0, 10) },
    { label: "Amount / Approved limit", list: list.approvedLimit, entered: entered.amount, mismatch: Number(entered.amount) > Number(list.approvedLimit) },
    { label: "Date of birth", list: fmtDate(list.dateOfBirth), entered: "—" },
    { label: "Channel", list: "—", entered: entered.channelName },
    { label: "Agent", list: "—", entered: <span dir="auto">{entered.agentName}</span> },
    { label: "Submitted", list: "—", entered: fmtDateTime(entered.createdAt) },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Eligibility list vs Agent entered</CardTitle>
            {data.status && <StatusBadge status={data.status} />}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Field</TableHead><TableHead>Eligibility list</TableHead><TableHead>Agent entered</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.label} className={r.mismatch ? "bg-destructive/10" : ""}>
                    <TableCell className="font-medium">{r.label}{r.mismatch && <Badge variant="destructive" className="ml-2">Mismatch</Badge>}</TableCell>
                    <TableCell>{r.list}</TableCell>
                    <TableCell>{r.entered}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <ImageViewer files={data.files} />
      </div>
      {!!data.rounds.length && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Review rounds</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.rounds.map((r) => (
              <div key={r.roundNumber} className="rounded-md border p-3 text-sm space-y-1">
                <div className="flex items-center gap-2"><span className="font-medium">Round {r.roundNumber}</span><DecisionBadge decision={r.decision} /><span className="text-muted-foreground">{r.reviewerName} · {fmtDateTime(r.reviewedAt)}</span></div>
                {!!r.reasons.length && <div className="flex flex-wrap gap-1">{r.reasons.map((x) => <Badge key={x} variant="outline" dir="auto">{x}</Badge>)}</div>}
                {r.note && <p dir="auto" className="text-muted-foreground">{r.note}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {!!data.statusHistory?.length && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Status history</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.statusHistory.map((h, i) => (
              <div key={i} className="flex items-center gap-2"><StatusBadge status={h.status} /><span>{fmtDateTime(h.changedAt)}</span><span dir="auto" className="text-muted-foreground">{h.changedByName}</span></div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

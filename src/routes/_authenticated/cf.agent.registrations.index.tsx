import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SectionGuard } from "@/components/section-guard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { PageHeader, StatusBadge, fmtDate } from "@/components/cf/cf-ui";
import { useCfAgentRegistrations } from "@/lib/cf-api";

export const Route = createFileRoute("/_authenticated/cf/agent/registrations/")({
  head: () => ({ meta: [{ title: "My Customers — Consumer Finance" }] }),
  component: () => <SectionGuard section="cf:agent"><Page /></SectionGuard>,
});

function Page() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCfAgentRegistrations({ search, status: status === "all" ? "" : status, page });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="My customers" />
      <div className="flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
          <Input dir="auto" className="h-12 pl-9" placeholder="Search by name" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="h-12 w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="1">Under review</SelectItem><SelectItem value="2">Approved</SelectItem><SelectItem value="3">Rejected</SelectItem></SelectContent>
        </Select>
      </div>
      {isLoading && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}
      {data?.items.map((r) => (
        <Card key={r.id}><CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <div><p dir="auto" className="font-medium">{r.customerName}</p><p className="text-xs text-muted-foreground">{fmtDate(r.createdAt)}</p></div>
            <StatusBadge status={r.status} />
          </div>
          {r.status === 3 && (
            <div className="space-y-2 rounded-md bg-destructive/10 p-3 text-sm">
              {!!r.rejectionReasons?.length && <div className="flex flex-wrap gap-1">{r.rejectionReasons.map((x) => <Badge key={x} variant="outline" dir="auto">{x}</Badge>)}</div>}
              {r.rejectionNote && <p dir="auto">{r.rejectionNote}</p>}
              <Button asChild className="h-11 w-full"><Link to="/cf/agent/registrations/$id/edit" params={{ id: String(r.id) }}>Edit</Link></Button>
            </div>
          )}
        </CardContent></Card>
      ))}
      {data && !data.items.length && <p className="text-center text-muted-foreground">No customers yet</p>}
      {pages > 1 && <div className="flex justify-center gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button><span className="self-center text-sm">{page}/{pages}</span><Button variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button></div>}
    </div>
  );
}

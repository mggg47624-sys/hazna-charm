import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NextLead } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { ExportButton } from "@/components/export-button";
import { FilterBar, buildRowFilter, type FilterValues } from "@/components/filters/filter-bar";

export const Route = createFileRoute("/_authenticated/qa/call-history")({
  component: () => (
    <SectionGuard section="qa:call-history">
      <QaCallHistoryPage />
    </SectionGuard>
  ),
});

const isUnanswered = (row: any) => {
  const id = row.CallResultId ?? row.callResultId;
  if (id != null) return Number(id) !== 1;
  const label = String(row.CallResult ?? row.callResult ?? "").toLowerCase();
  return /no answer|not answer|wrong|busy|unavailable/.test(label);
};

function QaCallHistoryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterValues>({});

  const q = useQuery({
    queryKey: ["qa", "history", user?.id],
    queryFn: () => api<any[]>("/api/Report/Calls"),
    enabled: !!user,
  });

  const pick = useMutation({
    mutationFn: (customerId: number) =>
      api<NextLead>(`/api/Queue/PickFromCallLater/${customerId}`, { method: "POST" }),
    onSuccess: (lead) => {
      qc.setQueryData(["queue", "next"], lead);
      toast.success("Lead loaded — continue in Work Queue");
      navigate({ to: "/qa/work" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const baseRows = (q.data ?? []).filter((r) => {
    if (!user?.id) return true;
    const aid = r.AgentId ?? r.agentId;
    if (aid == null) return true;
    return Number(aid) === Number(user.id);
  });

  const rowFilter = useMemo(
    () =>
      buildRowFilter<any>(
        filters,
        {
          mobile: (r) => r.Phone ?? r.phone,
          dateFrom: (r) => r.StartTime ?? r.startTime,
          callResult: (r) => r.CallResult ?? r.callResult,
        },
        [
          (r) => r.CustomerName ?? r.customerName,
          (r) => r.KhaznaId ?? r.khaznaId,
          (r) => r.Phone ?? r.phone,
          (r) => r.CallResult ?? r.callResult,
        ],
      ),
    [filters],
  );

  const rows = baseRows.filter(rowFilter);

  const onPickUp = (row: any) => {
    const id = row.CustomerId ?? row.customerId;
    if (!id) {
      toast.error("Missing customer id for this call");
      return;
    }
    pick.mutate(Number(id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Call History</h1>
          <p className="text-sm text-muted-foreground">Every customer call you performed.</p>
        </div>
        <ExportButton
          rows={rows}
          filename="qa-call-history"
          columns={[
            { label: "Khazna ID", key: "KhaznaId" },
            { label: "Customer", key: "CustomerName" },
            { label: "Phone", key: "Phone" },
            { label: "Result", key: "CallResult" },
            { label: "Start", key: "StartTime" },
            { label: "End", key: "EndTime" },
            { label: "Duration (min)", key: "DurationMinutes" },
            { label: "Score", key: "TotalScore" },
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calls</CardTitle>
          <div className="pt-3">
            <FilterBar
              fields={["search", "mobile", "dateFrom", "dateTo", "callResult"]}
              values={filters}
              onChange={setFilters}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !rows.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No calls match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khazna ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Duration (min)</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r: any) => (
                    <TableRow key={r.CallId ?? r.callId}>
                      <TableCell className="font-medium">{r.KhaznaId ?? "—"}</TableCell>
                      <TableCell>{r.CustomerName ?? "—"}</TableCell>
                      <TableCell>{r.Phone ?? r.phone ?? "—"}</TableCell>
                      <TableCell>{r.CallResult ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.StartTime ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.EndTime ?? "—"}</TableCell>
                      <TableCell className="text-right">{r.DurationMinutes ?? "—"}</TableCell>
                      <TableCell className="text-right">{r.TotalScore ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {isUnanswered(r) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pick.isPending}
                            onClick={() => onPickUp(r)}
                          >
                            Pick Up <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

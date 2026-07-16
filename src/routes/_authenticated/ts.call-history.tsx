import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import {
  useTsCallHistory,
  useTsPickCallLater,
  type TSCallHistory,
} from "@/lib/ts-api";
import { CopyButton } from "@/components/copy-button";
import { ExportButton } from "@/components/export-button";
import { FilterBar, buildRowFilter, type FilterValues } from "@/components/filters/filter-bar";

export const Route = createFileRoute("/_authenticated/ts/call-history")({
  component: () => (
    <SectionGuard section="ts:call-history">
      <TsCallHistoryPage />
    </SectionGuard>
  ),
});

const CR_ANSWERED = 1;
const isUnanswered = (row: TSCallHistory) => {
  if (row.callResultId != null) return Number(row.callResultId) !== CR_ANSWERED;
  const label = String(row.callResult ?? "").toLowerCase();
  return !!label && !label.includes("answer");
};

function TsCallHistoryPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const calls = useTsCallHistory();
  const pick = useTsPickCallLater();
  const [filters, setFilters] = useState<FilterValues>({});

  const rowFilter = useMemo(
    () =>
      buildRowFilter<TSCallHistory>(
        filters,
        {
          mobile: (r) => r.phone,
          dateFrom: (r) => r.lastCallAt,
          callResult: (r) => r.callResult ?? "",
        },
        [
          (r) => r.fullName,
          (r) => r.phone,
          (r) => r.companyName ?? "",
          (r) => r.campaignName ?? "",
          (r) => r.lastNotes ?? "",
          (r) => r.callResult ?? "",
        ],
      ),
    [filters],
  );

  const rows = (calls.data ?? []).filter(rowFilter);

  const onPickUp = (row: TSCallHistory) => {
    if (!row.leadId) {
      toast.error("Missing lead id for this call");
      return;
    }
    pick.mutate(row.leadId, {
      onSuccess: (lead) => {
        qc.setQueryData(["ts", "next"], lead);
        toast.success("Lead loaded — continue in Work Queue");
        navigate({ to: "/ts/work" });
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Call History</h1>
          <p className="text-sm text-muted-foreground">Every call you made across your campaigns.</p>
        </div>
        <ExportButton
          rows={rows}
          filename="ts-call-history"
          columns={[
            { label: "Lead", key: "fullName" },
            { label: "Phone", key: "phone" },
            { label: "Company", key: "companyName" },
            { label: "Campaign", key: "campaignName" },
            { label: "Result", key: "callResult" },
            { label: "Attempts", key: "attemptCount" },
            { label: "Last Call", key: "lastCallAt" },
            { label: "Notes", key: "lastNotes" },
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
          {calls.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !rows.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No calls match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Last Call</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.callAttemptId}>
                      <TableCell className="text-muted-foreground">{c.lastCallAt ? new Date(c.lastCallAt).toLocaleString() : "—"}</TableCell>
                      <TableCell className="font-medium">{c.fullName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.phone}
                          <CopyButton value={c.phone} />
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.companyName || "—"}</TableCell>
                      <TableCell>{c.campaignName ? <Badge variant="outline">{c.campaignName}</Badge> : "—"}</TableCell>
                      <TableCell>{c.callResult || "—"}</TableCell>
                      <TableCell className="text-right">{c.attemptCount}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[280px] truncate">{c.lastNotes || "—"}</TableCell>
                      <TableCell className="text-right">
                        {isUnanswered(c) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pick.isPending}
                            onClick={() => onPickUp(c)}
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

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Phone, ArrowRight } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import {
  useActiveCampaigns,
  useTsPickCallLater,
  useTsReportCalls,
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

const isUnanswered = (row: any) => {
  const id = row.callResultId ?? row.CallResultId;
  if (id != null) return Number(id) !== 1;
  const label = String(row.callResult ?? row.CallResult ?? "").toLowerCase();
  return !!label && !label.includes("answer") ? true : /no answer|not answer|wrong|busy|unavailable/.test(label);
};

function TsCallHistoryPage() {
  const campaigns = useActiveCampaigns();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid ?? campaigns.data?.[0]?.id;
  const calls = useTsReportCalls(activeCid);
  const pick = useTsPickCallLater();
  const [filters, setFilters] = useState<FilterValues>({});

  const rowFilter = useMemo(
    () =>
      buildRowFilter<any>(
        filters,
        {
          mobile: (r) => r.phone ?? r.Phone,
          dateFrom: (r) => r.callDate ?? r.CallDate,
          callResult: (r) => r.callResult ?? r.CallResult,
        },
        [
          (r) => r.customerName ?? r.CustomerName,
          (r) => r.phone ?? r.Phone,
          (r) => r.notes ?? r.Notes,
          (r) => r.callResult ?? r.CallResult,
        ],
      ),
    [filters],
  );

  const rows = (calls.data ?? []).filter(rowFilter);

  const onPickUp = (row: any) => {
    const id = row.leadId ?? row.LeadId ?? row.customerId ?? row.CustomerId;
    if (!id) {
      toast.error("Missing lead id for this call");
      return;
    }
    pick.mutate(Number(id), {
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
          <p className="text-sm text-muted-foreground">Every call you made for the selected campaign.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={activeCid ? String(activeCid) : ""} onValueChange={(v) => setCid(Number(v))}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Campaign" /></SelectTrigger>
            <SelectContent>
              {campaigns.data?.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButton
            rows={rows}
            filename="ts-call-history"
            columns={[
              { label: "Call ID", key: "callId" },
              { label: "Lead", key: "customerName" },
              { label: "Phone", key: "phone" },
              { label: "Result", key: "callResult" },
              { label: "Date", key: "callDate" },
              { label: "Duration (min)", key: "durationMinutes" },
              { label: "Notes", key: "notes" },
            ]}
          />
        </div>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Duration (min)</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c: any) => (
                    <TableRow key={c.callId}>
                      <TableCell className="text-muted-foreground">{new Date(c.callDate).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{c.customerName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.phone}
                          <CopyButton value={c.phone} />
                        </span>
                      </TableCell>
                      <TableCell>{c.callResult}</TableCell>
                      <TableCell className="text-right">{c.durationMinutes ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.notes || "—"}</TableCell>
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

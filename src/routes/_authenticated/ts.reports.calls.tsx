import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SectionGuard } from "@/components/section-guard";
import { CampaignSelector } from "@/components/campaign-selector";
import { useActiveCampaigns, useTsReportCalls } from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";
import { CopyButton } from "@/components/copy-button";
import {
  FilterBar,
  buildRowFilter,
  type FilterValues,
} from "@/components/filters/filter-bar";

export const Route = createFileRoute("/_authenticated/ts/reports/calls")({
  component: () => (
    <SectionGuard section="ts:reports">
      <TsCallsReport />
    </SectionGuard>
  ),
});

function TsCallsReport() {
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid;
  const q = useTsReportCalls(activeCid);
  const [values, setValues] = useState<FilterValues>({});

  const predicate = useMemo(
    () =>
      buildRowFilter<any>(
        values,
        {
          mobile: (r) => r.phone,
          dateFrom: (r) => r.callDate,
          dateTo: (r) => r.callDate,
          callResult: (r) => r.callResult,
          agent: (r) => r.agentName,
        },
        [(r: any) => r.customerName, (r: any) => r.phone, (r: any) => r.agentName],
      ),
    [values],
  );

  const rows = (q.data ?? []).filter(predicate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Calls Report</h1>
          <p className="text-sm text-muted-foreground">All TS calls for the selected campaign.</p>
        </div>
        <div className="flex items-center gap-2">
          <CampaignSelector value={activeCid} onChange={setCid} activeOnly />

          <ExportButton
            rows={rows}
            filename="ts-calls"
            columns={[
              { label: "Call ID", key: "callId" },
              { label: "Lead", key: "customerName" },
              { label: "Phone", key: "phone" },
              { label: "Result", key: "callResult" },
              { label: "Date", key: "callDate" },
              { label: "Duration (min)", key: "durationMinutes" },
              { label: "Agent", key: "agentName" },
              { label: "Notes", key: "notes" },
            ]}
          />
        </div>
      </div>
      <Card>
        <CardContent className="p-4 space-y-4">
          <FilterBar
            fields={["search", "mobile", "dateFrom", "dateTo", "callResult"]}
            values={values}
            onChange={setValues}
          />
          {q.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Duration (min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!rows.length ? (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No results</TableCell></TableRow>
                  ) : rows.map((c: any) => (
                    <TableRow key={c.callId}>
                      <TableCell className="text-muted-foreground">{new Date(c.callDate).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{c.customerName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          {c.phone}
                          <CopyButton value={c.phone} />
                        </span>
                      </TableCell>
                      <TableCell>{c.callResult}</TableCell>
                      <TableCell className="text-muted-foreground">{c.agentName ?? "—"}</TableCell>
                      <TableCell className="text-right">{c.durationMinutes ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-2 text-xs text-muted-foreground">{rows.length} record{rows.length === 1 ? "" : "s"}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

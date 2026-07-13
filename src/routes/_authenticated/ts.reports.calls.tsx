import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SectionGuard } from "@/components/section-guard";
import { useActiveCampaigns, useTsReportCalls } from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";
import { CopyButton } from "@/components/copy-button";

export const Route = createFileRoute("/_authenticated/ts/reports/calls")({
  component: () => (
    <SectionGuard section="ts:reports">
      <TsCallsReport />
    </SectionGuard>
  ),
});

function TsCallsReport() {
  const campaigns = useActiveCampaigns();
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid ?? campaigns.data?.[0]?.id;
  const q = useTsReportCalls(activeCid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Calls Report</h1>
          <p className="text-sm text-muted-foreground">All TS calls for the selected campaign.</p>
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
            rows={q.data ?? []}
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
        <CardContent className="p-0">
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
                  {(q.data ?? []).map((c: any) => (
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

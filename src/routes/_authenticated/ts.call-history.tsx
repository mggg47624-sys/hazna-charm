import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Phone } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SectionGuard } from "@/components/section-guard";
import { useActiveCampaigns, useTsReportCalls } from "@/lib/ts-api";
import { CopyButton } from "@/components/copy-button";
import { ExportButton } from "@/components/export-button";

export const Route = createFileRoute("/_authenticated/ts/call-history")({
  component: () => (
    <SectionGuard section="ts:call-history">
      <TsCallHistoryPage />
    </SectionGuard>
  ),
});

function TsCallHistoryPage() {
  const campaigns = useActiveCampaigns();
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid ?? campaigns.data?.[0]?.id;
  const calls = useTsReportCalls(activeCid);

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
            rows={calls.data ?? []}
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
        <CardHeader><CardTitle className="text-base">Calls</CardTitle></CardHeader>
        <CardContent className="p-0">
          {calls.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !calls.data?.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No calls yet.</div>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.data.map((c: any) => (
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

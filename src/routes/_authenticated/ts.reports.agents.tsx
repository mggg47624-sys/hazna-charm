import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SectionGuard } from "@/components/section-guard";
import { useActiveCampaigns, useTsReportAgents } from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";

export const Route = createFileRoute("/_authenticated/ts/reports/agents")({
  component: () => (
    <SectionGuard section="ts:reports">
      <TsAgentsReport />
    </SectionGuard>
  ),
});

function TsAgentsReport() {
  const campaigns = useActiveCampaigns();
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid ?? campaigns.data?.[0]?.id;
  const q = useTsReportAgents(activeCid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Agents Report</h1>
          <p className="text-sm text-muted-foreground">Per-agent stats for the selected campaign.</p>
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
            filename="ts-agents"
            columns={[
              { label: "Agent", key: "agentName" },
              { label: "Total Calls", key: "totalCalls" },
              { label: "Answered", key: "answeredCalls" },
              { label: "Conversions", key: "conversions" },
              { label: "Avg Call (min)", key: "avgCallMinutes" },
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
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Answered</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Avg (min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(q.data ?? []).map((r: any) => (
                    <TableRow key={r.agentId}>
                      <TableCell className="font-medium">{r.agentName}</TableCell>
                      <TableCell className="text-right">{r.totalCalls}</TableCell>
                      <TableCell className="text-right">{r.answeredCalls}</TableCell>
                      <TableCell className="text-right">{r.conversions}</TableCell>
                      <TableCell className="text-right">{Number(r.avgCallMinutes ?? 0).toFixed(1)}</TableCell>
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

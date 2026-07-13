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
import { Badge } from "@/components/ui/badge";
import { SectionGuard } from "@/components/section-guard";
import { useActiveCampaigns, useTsReportLeads } from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";
import { CopyButton } from "@/components/copy-button";

export const Route = createFileRoute("/_authenticated/ts/reports/leads")({
  component: () => (
    <SectionGuard section="ts:reports">
      <TsLeadsReport />
    </SectionGuard>
  ),
});

function TsLeadsReport() {
  const campaigns = useActiveCampaigns();
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid ?? campaigns.data?.[0]?.id;
  const q = useTsReportLeads(activeCid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads Report</h1>
          <p className="text-sm text-muted-foreground">Leads for the selected campaign.</p>
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
            filename="ts-leads"
            columns={[
              { label: "ID", key: "id" },
              { label: "Customer", key: "customerName" },
              { label: "Phone", key: "phone" },
              { label: "Company", key: "companyName" },
              { label: "City", key: "city" },
              { label: "Status", key: "status" },
              { label: "Assigned Agent", key: "assignedAgent" },
              { label: "Referral", key: "isReferral" },
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Referral</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(q.data ?? []).map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.customerName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          {l.phone}
                          <CopyButton value={l.phone} />
                        </span>
                      </TableCell>
                      <TableCell>{l.companyName ?? "—"}</TableCell>
                      <TableCell>{l.city ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{l.assignedAgent ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
                      <TableCell>{l.isReferral ? <Badge>Referral</Badge> : "—"}</TableCell>
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

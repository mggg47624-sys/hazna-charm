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
import { Badge } from "@/components/ui/badge";
import { SectionGuard } from "@/components/section-guard";
import { useActiveCampaigns, useTsReportLeads } from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";
import { CopyButton } from "@/components/copy-button";
import {
  FilterBar,
  buildRowFilter,
  type FilterValues,
} from "@/components/filters/filter-bar";

export const Route = createFileRoute("/_authenticated/ts/reports/leads")({
  component: () => (
    <SectionGuard section="ts:reports">
      <TsLeadsReport />
    </SectionGuard>
  ),
});

function TsLeadsReport() {
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid;
  const q = useTsReportLeads(activeCid);
  const [values, setValues] = useState<FilterValues>({});

  const predicate = useMemo(
    () =>
      buildRowFilter<any>(
        values,
        {
          mobile: (r) => r.phone,
          agent: (r) => r.assignedAgent,
        },
        [
          (r: any) => r.customerName,
          (r: any) => r.phone,
          (r: any) => r.companyName,
          (r: any) => r.city,
        ],
      ),
    [values],
  );

  const rows = (q.data ?? []).filter(predicate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads Report</h1>
          <p className="text-sm text-muted-foreground">Leads for the selected campaign.</p>
        </div>
        <div className="flex items-center gap-2">
          <CampaignSelector value={activeCid} onChange={setCid} activeOnly />

          <ExportButton
            rows={rows}
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
        <CardContent className="p-4 space-y-4">
          <FilterBar
            fields={["search", "mobile"]}
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
                  {!rows.length ? (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No results</TableCell></TableRow>
                  ) : rows.map((l: any) => (
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
              <div className="mt-2 text-xs text-muted-foreground">{rows.length} record{rows.length === 1 ? "" : "s"}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

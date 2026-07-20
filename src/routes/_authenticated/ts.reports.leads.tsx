import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { CampaignSelector } from "@/components/campaign-selector";
import { useEditLead, useTsReportLeads } from "@/lib/ts-api";
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

interface EditState {
  leadId: number;
  fullName: string;
  phone: string;
  company: string;
}

function TsLeadsReport() {
  const [cid, setCid] = useState<number | undefined>(undefined);
  const q = useTsReportLeads(cid);
  const [values, setValues] = useState<FilterValues>({});
  const [edit, setEdit] = useState<EditState | null>(null);
  const editMut = useEditLead();

  const predicate = useMemo(
    () =>
      buildRowFilter<any>(
        values,
        { mobile: (r) => r.phone, agent: (r) => r.assignedAgent },
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

  const submitEdit = () => {
    if (!edit) return;
    editMut.mutate(edit, {
      onSuccess: () => {
        toast.success("Lead updated");
        setEdit(null);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads Report</h1>
          <p className="text-sm text-muted-foreground">Leads for the selected campaign.</p>
        </div>
        <div className="flex items-center gap-2">
          <CampaignSelector value={cid} onChange={setCid} activeOnly />
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
          <FilterBar fields={["search", "mobile"]} values={values} onChange={setValues} />
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!rows.length ? (
                    <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No results</TableCell></TableRow>
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
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setEdit({
                              leadId: l.id,
                              fullName: l.customerName ?? "",
                              phone: l.phone ?? "",
                              company: l.companyName ?? "",
                            })
                          }
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-2 text-xs text-muted-foreground">{rows.length} record{rows.length === 1 ? "" : "s"}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          {edit && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  value={edit.fullName}
                  onChange={(e) => setEdit({ ...edit, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={edit.phone}
                  onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  value={edit.company}
                  onChange={(e) => setEdit({ ...edit, company: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
            <Button onClick={submitEdit} disabled={editMut.isPending}>
              {editMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


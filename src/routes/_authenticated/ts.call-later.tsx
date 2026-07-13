import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Phone } from "lucide-react";
import { SectionGuard } from "@/components/section-guard";
import { useTsCallLater } from "@/lib/ts-api";
import { CopyButton } from "@/components/copy-button";

export const Route = createFileRoute("/_authenticated/ts/call-later")({
  component: () => (
    <SectionGuard section="ts:agent">
      <TsCallLaterPage />
    </SectionGuard>
  ),
});

function TsCallLaterPage() {
  const q = useTsCallLater();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">TS Call Later</h1>
        <p className="text-sm text-muted-foreground">Scheduled callbacks for your assigned leads.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Scheduled leads</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !q.data?.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No scheduled callbacks.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.data.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.customerName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <a className="text-primary hover:underline" href={`tel:${l.phone}`}>{l.phone}</a>
                          <CopyButton value={l.phone} />
                        </span>
                      </TableCell>
                      <TableCell>{l.companyName || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {l.scheduledAt ? new Date(l.scheduledAt).toLocaleString() : "—"}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{l.notes || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{l.status || "scheduled"}</Badge></TableCell>
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

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { useTsCallLater, useTsPickCallLater } from "@/lib/ts-api";
import { CopyButton } from "@/components/copy-button";
import { FilterBar, buildRowFilter, type FilterValues } from "@/components/filters/filter-bar";

export const Route = createFileRoute("/_authenticated/ts/call-later")({
  component: () => (
    <SectionGuard section="ts:agent">
      <TsCallLaterPage />
    </SectionGuard>
  ),
});

function TsCallLaterPage() {
  const q = useTsCallLater();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const pick = useTsPickCallLater();

  const onPick = (id: number) => {
    pick.mutate(id, {
      onSuccess: (lead) => {
        qc.setQueryData(["ts", "next"], lead);
        qc.invalidateQueries({ queryKey: ["ts", "callLater"] });
        toast.success("Lead loaded — continue in Work Queue");
        navigate({ to: "/ts/work" });
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Call Later</h1>
        <p className="text-sm text-muted-foreground">
          Scheduled callbacks for your assigned leads.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduled leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !q.data?.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No scheduled callbacks.
            </div>
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
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.data.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.customerName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <a className="text-primary hover:underline" href={`tel:${l.phone}`}>
                            {l.phone}
                          </a>
                          <CopyButton value={l.phone} />
                        </span>
                      </TableCell>
                      <TableCell>{l.companyName || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />{" "}
                          {l.scheduledAt ? new Date(l.scheduledAt).toLocaleString() : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{l.notes || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{l.status || "scheduled"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => onPick(l.id)}
                          disabled={pick.isPending}
                        >
                          Pick Up <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
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

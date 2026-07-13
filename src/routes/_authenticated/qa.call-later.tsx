import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CallLaterItem, NextLead } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { FilterBar, buildRowFilter, type FilterValues } from "@/components/filters/filter-bar";

export const Route = createFileRoute("/_authenticated/qa/call-later")({
  component: CallLaterPage,
});

function CallLaterPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["queue", "callLater"],
    queryFn: () => api<CallLaterItem[]>("/api/Queue/CallLater"),
  });
  const qc = useQueryClient();
  const navigate = useNavigate();

  const pick = useMutation({
    mutationFn: (customerId: number) =>
      api<NextLead>(`/api/Queue/PickFromCallLater/${customerId}`, { method: "POST" }),
    onSuccess: (lead) => {
      // Seed the Work Queue cache so it renders this lead immediately
      // without asking the backend for another one.
      qc.setQueryData(["queue", "next"], lead);
      qc.invalidateQueries({ queryKey: ["queue", "callLater"] });
      toast.success("Lead loaded — continue in Work Queue");
      navigate({ to: "/qa/work" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data || [];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Call Later</h1>
        <p className="text-sm text-muted-foreground">
          Customers you scheduled for a callback
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {rows.length} pending callback{rows.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-5 w-5 animate-spin inline text-primary" />
                    </TableCell>
                  </TableRow>
                ) : !rows.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No callbacks scheduled
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((c) => (
                    <TableRow key={c.customerId}>
                      <TableCell className="font-medium">{c.customerName}</TableCell>
                      <TableCell>
                        <a
                          href={`tel:${c.phone}`}
                          className="text-primary inline-flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" /> {c.phone}
                        </a>
                      </TableCell>
                      <TableCell>{c.companyName || "—"}</TableCell>
                      <TableCell>{c.transactionType || "—"}</TableCell>
                      <TableCell>{c.salesRepName || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => pick.mutate(c.customerId)}
                          disabled={pick.isPending}
                        >
                          Pick Up <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

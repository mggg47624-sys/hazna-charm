import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SectionGuard } from "@/components/section-guard";
import { CopyButton } from "@/components/copy-button";
import { ExportButton } from "@/components/export-button";

export const Route = createFileRoute("/_authenticated/qa/call-history")({
  component: () => (
    <SectionGuard section="qa:call-history">
      <QaCallHistoryPage />
    </SectionGuard>
  ),
});

function QaCallHistoryPage() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["qa", "history", user?.id],
    queryFn: () => api<any[]>("/api/Report/Calls"),
    enabled: !!user,
  });

  const rows = (q.data ?? []).filter((r) => {
    if (!user?.id) return true;
    const aid = r.AgentId ?? r.agentId;
    if (aid == null) return true; // backend may not include AgentId in dev
    return Number(aid) === Number(user.id);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Call History</h1>
          <p className="text-sm text-muted-foreground">Every customer call you performed.</p>
        </div>
        <ExportButton
          rows={rows}
          filename="qa-call-history"
          columns={[
            { label: "Khazna ID", key: "KhaznaId" },
            { label: "Customer", key: "CustomerName" },
            { label: "Result", key: "CallResult" },
            { label: "Start", key: "StartTime" },
            { label: "End", key: "EndTime" },
            { label: "Duration (min)", key: "DurationMinutes" },
            { label: "Score", key: "TotalScore" },
          ]}
        />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Calls</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !rows.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No calls yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khazna ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Duration (min)</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r: any) => (
                    <TableRow key={r.CallId ?? r.callId}>
                      <TableCell className="font-medium">{r.KhaznaId ?? "—"}</TableCell>
                      <TableCell>{r.CustomerName ?? "—"}</TableCell>
                      <TableCell>{r.CallResult ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.StartTime ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.EndTime ?? "—"}</TableCell>
                      <TableCell className="text-right">{r.DurationMinutes ?? "—"}</TableCell>
                      <TableCell className="text-right">{r.TotalScore ?? "—"}</TableCell>
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

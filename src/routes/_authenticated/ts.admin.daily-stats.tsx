import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SectionGuard } from "@/components/section-guard";
import { ExportButton } from "@/components/export-button";
import { useAgentDailyStats } from "@/lib/ts-api";

export const Route = createFileRoute("/_authenticated/ts/admin/daily-stats")({
  component: () => (
    <SectionGuard section="ts:daily-stats">
      <Page />
    </SectionGuard>
  ),
});

function fmtSecs(s?: number) {
  if (!s || s < 0) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}h ${m}m` : m ? `${m}m ${sec}s` : `${sec}s`;
}
function fmtTime(t?: string | null) {
  if (!t) return "—";
  // Accept "HH:mm:ss" or ISO
  const m = /(\d{2}):(\d{2})(?::(\d{2}))?/.exec(t);
  return m ? `${m[1]}:${m[2]}` : t;
}

function Page() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState("");
  const q = useAgentDailyStats(date);

  const rows = useMemo(() => {
    const list = q.data ?? [];
    const s = search.trim().toLowerCase();
    if (!s) return list;
    return list.filter((r) =>
      `${r.agentName ?? ""} ${r.agentId}`.toLowerCase().includes(s),
    );
  }, [q.data, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Agent Daily Work</h1>
          <p className="text-sm text-muted-foreground">
            Daily activity per agent — login, calls, idle time and target progress.
          </p>
        </div>
        <ExportButton
          rows={rows}
          filename={`agent-daily-${date}`}
          columns={[
            { label: "Agent", key: "agentName" },
            { label: "Date", key: "statDate" },
            { label: "Login", key: "loginTime" },
            { label: "Last Action", key: "lastActionTime" },
            { label: "First Call", key: "firstCallTime" },
            { label: "Last Call", key: "lastCallTime" },
            { label: "Total Calls", key: "totalCalls" },
            { label: "Completed Calls", key: "completedCalls" },
            { label: "Talk Time (s)", key: "totalCallSeconds" },
            { label: "Idle (s)", key: "totalIdleSeconds" },
            { label: "Target", key: "targetCalls" },
            { label: "Achieved", key: "targetAchieved" },
          ]}
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[220px]">
            <Label>Search agent</Label>
            <Input
              placeholder="Search by agent name or id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Last Action</TableHead>
                  <TableHead>First Call</TableHead>
                  <TableHead>Last Call</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Talk</TableHead>
                  <TableHead>Idle</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      <Loader2 className="h-5 w-5 animate-spin inline text-primary" />
                    </TableCell>
                  </TableRow>
                ) : !rows.length ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                      No records for this date
                    </TableCell>
                  </TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.agentName ?? `#${r.agentId}`}</TableCell>
                    <TableCell>{fmtTime(r.loginTime)}</TableCell>
                    <TableCell>{fmtTime(r.lastActionTime)}</TableCell>
                    <TableCell>{fmtTime(r.firstCallTime)}</TableCell>
                    <TableCell>{fmtTime(r.lastCallTime)}</TableCell>
                    <TableCell>{r.totalCalls}</TableCell>
                    <TableCell>{r.completedCalls}</TableCell>
                    <TableCell>{fmtSecs(r.totalCallSeconds)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtSecs(r.totalIdleSeconds)}</TableCell>
                    <TableCell>{r.targetCalls}</TableCell>
                    <TableCell>
                      {r.targetAchieved ? (
                        <Badge>Achieved</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-3 text-xs text-muted-foreground">
              {rows.length} agent{rows.length === 1 ? "" : "s"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

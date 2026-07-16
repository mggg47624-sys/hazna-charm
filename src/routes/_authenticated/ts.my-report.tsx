import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { SectionGuard } from "@/components/section-guard";
import { useTsAgentToday, useTsAgentByDate } from "@/lib/ts-api";

export const Route = createFileRoute("/_authenticated/ts/my-report")({
  component: () => (
    <SectionGuard section="ts:agent">
      <Page />
    </SectionGuard>
  ),
});

function Page() {
  const [date, setDate] = useState<string>("");
  const today = useTsAgentToday();
  const byDate = useTsAgentByDate(date || undefined);
  const active = date ? byDate : today;
  const data = active.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My Daily Report</h1>
          <p className="text-sm text-muted-foreground">Your call activity and KPIs.</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {date && (
            <Button variant="outline" onClick={() => setDate("")}>Today</Button>
          )}
        </div>
      </div>

      {active.isLoading ? (
        <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : !data ? (
        <div className="p-10 text-center text-sm text-muted-foreground">No data.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Stat label="Total Calls" value={data.totalCalls ?? 0} />
            <Stat label="Answered" value={data.answeredCalls ?? 0} />
            <Stat label="No Answer" value={data.unansweredCalls ?? 0} />
            <Stat label="Wrong Number" value={data.wrongNumberCalls ?? 0} />
            <Stat label="Call Later" value={data.callLaterCalls ?? 0} />
            <Stat label="Not Interested" value={data.notInterestedCalls ?? 0} />
            <Stat label="Target" value={`${data.completedCalls ?? 0} / ${data.targetCalls ?? "—"}`} />
            <Stat label="First Call" value={data.firstCallTime ?? "—"} />
            <Stat label="Last Call" value={data.lastCallTime ?? "—"} />
            <Stat label="Avg Call (min)" value={data.avgCallMinutes != null ? Number(data.avgCallMinutes).toFixed(1) : "—"} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Calls</CardTitle></CardHeader>
            <CardContent className="p-0">
              {!data.calls?.length ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No calls for this date.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Start</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead className="text-right">Duration (min)</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.calls.map((c) => (
                        <TableRow key={c.callAttemptId}>
                          <TableCell className="text-muted-foreground">{c.startTime ? new Date(c.startTime).toLocaleString() : "—"}</TableCell>
                          <TableCell className="font-medium">{c.leadName || "—"}</TableCell>
                          <TableCell>{c.phone}</TableCell>
                          <TableCell>{c.callResult || "—"}</TableCell>
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
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold leading-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { SectionGuard } from "@/components/section-guard";
import { useMyWarnings } from "@/lib/ts-api";

export const Route = createFileRoute("/_authenticated/ts/my-warnings")({
  component: () => (
    <SectionGuard section="ts:my-warnings">
      <MyWarningsPage />
    </SectionGuard>
  ),
});

function MyWarningsPage() {
  const q = useMyWarnings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Warnings</h1>
        <p className="text-sm text-muted-foreground">Warnings issued to you by TS admins.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Warnings</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !q.data?.length ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No warnings 🎉</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reply</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.data.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-muted-foreground">{new Date(w.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{w.reason}</TableCell>
                      <TableCell>{w.severity}</TableCell>
                      <TableCell><Badge variant="outline">{w.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{w.reply ?? "—"}</TableCell>
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

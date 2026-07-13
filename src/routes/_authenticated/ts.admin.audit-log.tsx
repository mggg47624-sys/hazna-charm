import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { SectionGuard } from "@/components/section-guard";
import { useAuditLog } from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";

export const Route = createFileRoute("/_authenticated/ts/admin/audit-log")({
  component: () => (
    <SectionGuard section="ts:audit">
      <AuditLogPage />
    </SectionGuard>
  ),
});

function AuditLogPage() {
  const q = useAuditLog();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">All admin & agent actions on the TeleSales system.</p>
        </div>
        <ExportButton
          rows={q.data ?? []}
          filename="ts-audit-log"
          columns={[
            { label: "ID", key: "id" },
            { label: "User", key: "userName" },
            { label: "Action", key: "action" },
            { label: "Entity", key: "entity" },
            { label: "Entity ID", key: "entityId" },
            { label: "Details", key: "details" },
            { label: "Date", key: "createdAt" },
          ]}
        />
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
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(q.data ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground text-sm">{new Date(r.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{r.userName}</TableCell>
                      <TableCell>{r.action}</TableCell>
                      <TableCell>{r.entity} #{r.entityId}</TableCell>
                      <TableCell className="text-muted-foreground">{r.details}</TableCell>
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

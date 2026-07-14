import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import { useAuditLog } from "@/lib/ts-api";
import { ExportButton } from "@/components/export-button";
import type { AppUser } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ts/admin/audit-log")({
  component: () => (
    <SectionGuard section="ts:audit">
      <AuditLogPage />
    </SectionGuard>
  ),
});

const TABLES = ["ts.Leads", "ts.Batches", "ts.Campaigns", "ts.Forms", "ts.CallAttempts", "ts.Warnings"];

function AuditLogPage() {
  const [tableName, setTable] = useState<string>("");
  const [userId, setUser] = useState<string>("");
  const q = useAuditLog({
    tableName: tableName || undefined,
    userId: userId ? Number(userId) : undefined,
  });
  const users = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => api<AppUser[]>("/api/users/Get%20All%20Users"),
  });

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
            { label: "Table", key: "tableName" },
            { label: "Record", key: "recordId" },
            { label: "Old", key: "oldValue" },
            { label: "New", key: "newValue" },
            { label: "Date", key: "createdAt" },
          ]}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Table</Label>
              <Select value={tableName || "all"} onValueChange={(v) => setTable(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tables</SelectItem>
                  {TABLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>User</Label>
              <Select value={userId || "all"} onValueChange={(v) => setUser(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {(users.data ?? []).map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Custom table</Label>
              <Input value={tableName} onChange={(e) => setTable(e.target.value)} placeholder="ts.Xxx" />
            </div>
          </div>
        </CardHeader>
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
                    <TableHead>Table</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead>Old → New</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(q.data ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground text-sm">{new Date(r.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{r.userName}</TableCell>
                      <TableCell>{r.action}</TableCell>
                      <TableCell>{r.tableName ?? r.entity}</TableCell>
                      <TableCell>#{r.recordId ?? r.entityId}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-md truncate">
                        {r.oldValue ? `${r.oldValue} → ${r.newValue ?? ""}` : r.details ?? "—"}
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

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { SectionGuard } from "@/components/section-guard";
import { ExportButton } from "@/components/export-button";
import type { AppUser } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ts/admin/users")({
  component: () => (
    <SectionGuard section="ts:admin">
      <TsUsersPage />
    </SectionGuard>
  ),
});

function TsUsersPage() {
  const q = useQuery({
    queryKey: ["users", "ts"],
    queryFn: () => api<AppUser[]>("/api/users/Get%20All%20Users"),
  });

  const rows = (q.data ?? []).filter((u) => [5, 6, 7].includes(Number(u.roleId)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">TeleSales Users</h1>
          <p className="text-sm text-muted-foreground">TS Agents, Team Leaders and Admins.</p>
        </div>
        <ExportButton
          rows={rows}
          filename="ts-users"
          columns={[
            { label: "ID", key: "id" },
            { label: "Name", key: "fullName" },
            { label: "Email", key: "email" },
            { label: "Role", key: "roleName" },
            { label: "Team Leader", key: "teamLeaderName" },
            { label: "Active", key: "isActive" },
          ]}
        />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Users</CardTitle></CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Team Leader</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{u.roleName || u.roleId}</TableCell>
                      <TableCell className="text-muted-foreground">{u.teamLeaderName ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? "default" : "outline"}>
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Manage the shared user directory (add / edit / toggle) from{" "}
        <a href="/qa/admin/users" className="underline">/qa/admin/users</a>.
      </p>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { AppUser } from "@/lib/types";
import { useRoles } from "@/lib/lookups";
import { isRecordActive } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, KeyRound, Search } from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";

export const Route = createFileRoute("/_authenticated/qa/admin/users")({
  component: UsersPage,
});

interface FormState {
  id?: number;
  fullName: string;
  email: string;
  password?: string;
  roleId: number;
  teamLeaderId?: number | null;
}

function UsersPage() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api<AppUser[]>("/api/users/Get%20All%20Users"),
  });
  const roles = useRoles();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ fullName: "", email: "", password: "", roleId: 2 });

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const reset = () => setForm({ fullName: "", email: "", password: "", roleId: 2 });

  const save = useMutation({
    mutationFn: async () => {
      if (form.id) {
        return api(`/api/users/${form.id}/Edit%20User`, { method: "PUT", body: { ...form, password: undefined } });
      }
      return api("/api/users/Add%20New%20User", { method: "POST", body: form });
    },
    onSuccess: () => {
      toast.success(form.id ? "User updated" : "User created");
      qc.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (id: number) => api(`/api/users/${id}/ToggleActive`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const reset_pwd = useMutation({
    mutationFn: (id: number) => api(`/api/users/${id}/ResetPassword`, { method: "PATCH" }),
    onSuccess: () => toast.success("Password reset — user will receive new credentials"),
    onError: (e: Error) => toast.error(e.message),
  });

  const teamLeaders = (users || []).filter((u) => u.roleId === 3);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (users || []).filter((u) => {
      if (q) {
        const hay = `${u.fullName || ""} ${u.email || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (roleFilter !== "all" && String(u.roleId) !== roleFilter) return false;
      if (statusFilter !== "all") {
        const active = isRecordActive(u);
        if (statusFilter === "active" && !active) return false;
        if (statusFilter === "inactive" && active) return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <SectionGuard section="qa:admin"><div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage system users and roles</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add User
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {roles.data?.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.nameEn || r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-primary" /></TableCell></TableRow>
              ) : !filtered.length ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No users</TableCell></TableRow>
              ) : filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName || "—"}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant="secondary">{u.roleName || `Role ${u.roleId}`}</Badge></TableCell>
                  <TableCell>
                    <Switch checked={isRecordActive(u)} onCheckedChange={() => toggle.mutate(u.id)} />
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setForm({ id: u.id, fullName: u.fullName || "", email: u.email, roleId: u.roleId, teamLeaderId: u.teamLeaderId });
                      setOpen(true);
                    }}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => reset_pwd.mutate(u.id)}>
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Full Name</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            {!form.id && (
              <div className="space-y-1.5 col-span-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={String(form.roleId)} onValueChange={(v) => setForm({ ...form, roleId: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.data?.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.nameEn || r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.roleId === 2 && (
              <div className="space-y-1.5">
                <Label>Team Leader</Label>
                <Select value={form.teamLeaderId ? String(form.teamLeaderId) : ""} onValueChange={(v) => setForm({ ...form, teamLeaderId: Number(v) })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {teamLeaders.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.fullName || "—"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div></SectionGuard>
  );
}

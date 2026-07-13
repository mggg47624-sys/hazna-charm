import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { SalesRep } from "@/lib/types";
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
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { SectionGuard } from "@/components/section-guard";
import { useRoles, useTeamLeaders } from "@/lib/lookups";

export const Route = createFileRoute("/_authenticated/qa/admin/sales-reps")({
  component: SalesRepsPage,
});

interface FormState {
  id?: number;
  khaznaId: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  teamLeaderId?: number | null;
  roleId?: number | null;
}

const getKhazna = (r: any) => r.khaznaId ?? r.khazna_id ?? r.khaznaID ?? r.code ?? "";
const getTL = (r: any) => r.teamLeaderName ?? r.teamLeader ?? r.tlName ?? r.teamLeaderFullName ?? "";
const getPhone = (r: any) => r.phone ?? r.phoneNumber ?? r.mobile ?? "";
const getWa = (r: any) => r.whatsapp ?? r.whatsappNumber ?? r.whatsApp ?? "";
const getEmail = (r: any) => r.email ?? r.emailAddress ?? "";

function SalesRepsPage() {
  const qc = useQueryClient();
  const reps = useQuery({ queryKey: ["salesReps"], queryFn: () => api<SalesRep[]>("/api/SalesRep/GetAll") });
  // Team leaders for the edit form. The SalesRep/TeamLeaders endpoint can be
  // empty in some environments; fall back to the shared Lookup/TeamLeaders.
  const tlsApi = useQuery({
    queryKey: ["salesReps", "tls"],
    queryFn: () => api<any[]>("/api/SalesRep/TeamLeaders"),
    retry: 0,
  });
  const tlsLookup = useTeamLeaders();
  const tls = (tlsApi.data && tlsApi.data.length > 0 ? tlsApi.data : tlsLookup.data) || [];
  const rolesLk = useRoles();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ khaznaId: "", fullName: "", phone: "", whatsapp: "", email: "" });

  const [search, setSearch] = useState("");
  const [tlFilter, setTlFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const reset = () => setForm({ khaznaId: "", fullName: "", phone: "", whatsapp: "", email: "" });

  const save = useMutation({
    mutationFn: async () => {
      if (form.id) return api(`/api/SalesRep/${form.id}/Edit`, { method: "PUT", body: form });
      return api("/api/SalesRep/Add", { method: "POST", body: form });
    },
    onSuccess: () => {
      toast.success(form.id ? "Updated" : "Sales rep added");
      qc.invalidateQueries({ queryKey: ["salesReps"] });
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: (id: number) => api(`/api/SalesRep/${id}/ToggleActive`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salesReps"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const tlNames = useMemo(() => {
    const s = new Set<string>();
    (reps.data || []).forEach((r) => {
      const n = getTL(r);
      if (n) s.add(n);
    });
    return Array.from(s).sort();
  }, [reps.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (reps.data || []).filter((r: any) => {
      if (q) {
        const hay = `${r.fullName || ""} ${getKhazna(r)} ${getPhone(r)} ${getEmail(r)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (tlFilter !== "all" && getTL(r) !== tlFilter) return false;
      if (roleFilter !== "all" && String(r.roleId ?? r.RoleId ?? "") !== roleFilter) return false;
      if (statusFilter !== "all") {
        const active = isRecordActive(r);
        if (statusFilter === "active" && !active) return false;
        if (statusFilter === "inactive" && active) return false;
      }
      return true;
    });
  }, [reps.data, search, tlFilter, statusFilter, roleFilter]);

  return (
    <SectionGuard section="qa:admin"><div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales Reps</h1>
          <p className="text-sm text-muted-foreground">Manage sales representatives</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Sales Rep
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, Khazna ID, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={tlFilter} onValueChange={setTlFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Team Leader" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All team leaders</SelectItem>
              {tlNames.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {rolesLk.data?.map((r) => (
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
                <TableHead>Khazna ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Team Leader</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reps.isLoading ? (
                <TableRow><TableCell colSpan={9} className="h-24 text-center"><Loader2 className="h-5 w-5 animate-spin inline text-primary" /></TableCell></TableRow>
              ) : !filtered.length ? (
                <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No sales reps</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{getKhazna(r) || "—"}</TableCell>
                  <TableCell>{r.fullName}</TableCell>
                  <TableCell>{getPhone(r) || "—"}</TableCell>
                  <TableCell>{getWa(r) || "—"}</TableCell>
                  <TableCell>{getEmail(r) || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{getTL(r) || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">Sales Rep</Badge></TableCell>
                  <TableCell><Switch checked={isRecordActive(r)} onCheckedChange={() => toggle.mutate(r.id)} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setForm({ id: r.id, khaznaId: getKhazna(r), fullName: r.fullName, phone: getPhone(r), whatsapp: getWa(r), email: getEmail(r), teamLeaderId: (r as any).teamLeaderId ?? (r as any).TeamLeaderId ?? null, roleId: (r as any).roleId ?? (r as any).RoleId ?? null });
                      setOpen(true);
                    }}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form.id ? "Edit Sales Rep" : "Add Sales Rep"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Khazna ID</Label>
              <Input value={form.khaznaId} onChange={(e) => setForm({ ...form, khaznaId: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp number" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Team Leader</Label>
              <Select value={form.teamLeaderId ? String(form.teamLeaderId) : ""} onValueChange={(v) => setForm({ ...form, teamLeaderId: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Select team leader..." /></SelectTrigger>
                <SelectContent>
                  {tls.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.fullName || t.name || "—"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.roleId ? String(form.roleId) : ""} onValueChange={(v) => setForm({ ...form, roleId: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                <SelectContent>
                  {rolesLk.data?.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.nameEn || r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

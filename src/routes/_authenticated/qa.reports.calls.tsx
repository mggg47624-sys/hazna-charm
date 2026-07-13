import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ReportTable } from "@/components/report-table";
import { SectionGuard } from "@/components/section-guard";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCallResults } from "@/lib/lookups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export const Route = createFileRoute("/_authenticated/qa/reports/calls")({
  component: CallsReport,
});

function CallsReport() {
  const { data } = useQuery({ queryKey: ["reports", "calls"], queryFn: () => api<any[]>("/api/Report/Calls") });
  const callResults = useCallResults();
  const rows = data || [];

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [agent, setAgent] = useState("all");
  const [result, setResult] = useState("all");

  const agents = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.agentName && set.add(r.agentName));
    return Array.from(set).sort();
  }, [rows]);

  const clientFilter = useMemo(
    () => (r: any) => {
      const d = String(r.calledAt || "").slice(0, 10);
      if (from && d && d < from) return false;
      if (to && d && d > to) return false;
      if (agent !== "all" && r.agentName !== agent) return false;
      if (result !== "all" && String(r.callResult || "") !== result) return false;
      return true;
    },
    [from, to, agent, result],
  );

  const filtered = rows.filter(clientFilter);
  const dist = filtered.reduce<Record<string, number>>((a, r) => {
    const k = r.callResult || "Unknown";
    a[k] = (a[k] || 0) + 1; return a;
  }, {});
  const distData = Object.entries(dist).map(([name, value]) => ({ name, value }));

  const byAgent = filtered.reduce<Record<string, number>>((a, r) => {
    const k = r.agentName || "—";
    a[k] = (a[k] || 0) + 1; return a;
  }, {});
  const agentData = Object.entries(byAgent).map(([name, calls]) => ({ name, calls })).sort((a, b) => b.calls - a.calls).slice(0, 10);

  return (
    <SectionGuard section="qa:reports">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Calls Report</h1>
          <p className="text-sm text-muted-foreground">All call attempts and outcomes</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Result Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={distData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                    {distData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Calls by Agent</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={agentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="calls" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <ReportTable
          queryKey={["reports", "calls"]}
          endpoint="/api/Report/Calls"
          filename="calls.csv"
          searchPlaceholder="Search customer, phone..."
          clientFilter={clientFilter}
          extraFilters={
            <>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" />
              <Select value={agent} onValueChange={setAgent}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Agent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {agents.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Result" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All results</SelectItem>
                  {callResults.data?.map((r) => (
                    <SelectItem key={r.id} value={r.name}>{r.nameEn || r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          columns={[
            { key: "calledAt", header: "Date", accessor: (r: any) => (r.calledAt || "").toString().slice(0, 16).replace("T", " ") || "—" },
            { key: "customerName", header: "Customer", accessor: (r: any) => r.customerName || "—" },
            { key: "phone", header: "Phone", accessor: (r: any) => r.phone || "—" },
            { key: "salesRepName", header: "Sales Rep", accessor: (r: any) => r.salesRepName || "—" },
            { key: "teamLeaderName", header: "Team Leader", accessor: (r: any) => r.teamLeaderName || "—" },
            { key: "transactionType", header: "Transaction", accessor: (r: any) => r.transactionType || "—" },
            { key: "agentName", header: "QA Agent", accessor: (r: any) => r.agentName || "—" },
            { key: "callResult", header: "Result", accessor: (r: any) => r.callResult || "—" },
            { key: "notes", header: "Notes", accessor: (r: any) => {
              const n = r.notes || "";
              return n.length > 40 ? n.slice(0, 40) + "…" : n || "—";
            } },
          ]}
        />
      </div>
    </SectionGuard>
  );
}

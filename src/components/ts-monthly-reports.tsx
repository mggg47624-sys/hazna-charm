import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  Headset,
  Megaphone,
  Search,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/export-button";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TsMonthlyReportKind = "overview" | "campaigns" | "companies" | "agents";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const REPORT_LINKS: Array<{ kind: TsMonthlyReportKind; title: string; href: string }> = [
  { kind: "overview", title: "Overview", href: "/ts/reports/monthly/" },
  { kind: "campaigns", title: "Campaigns", href: "/ts/reports/monthly/campaigns" },
  { kind: "companies", title: "Companies", href: "/ts/reports/monthly/companies" },
  { kind: "agents", title: "Agents", href: "/ts/reports/monthly/agents" },
];

const TITLES: Record<TsMonthlyReportKind, { title: string; subtitle: string }> = {
  overview: { title: "TeleSales Monthly Overview", subtitle: "A presentation-ready view of monthly activity, outcomes, and performance." },
  campaigns: { title: "Campaign Performance", subtitle: "Compare call volume, reach, conversions, and monthly conversion rates." },
  companies: { title: "Company Performance", subtitle: "See monthly lead outcomes across partner companies and sources." },
  agents: { title: "Agent Performance", subtitle: "Review agent productivity, conversions, and target attainment." },
};

const now = new Date();
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
  return {
    value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
});

const CAMPAIGN_BASE = [
  { name: "Salary Advance", calls: 1380, leads: 1104, conversions: 196 },
  { name: "Flexi Purchase", calls: 1125, leads: 855, conversions: 148 },
  { name: "Quick Cash", calls: 940, leads: 713, conversions: 119 },
  { name: "Payroll Plus", calls: 760, leads: 601, conversions: 92 },
];

const COMPANY_BASE = [
  { name: "Nile Retail Group", calls: 1280, leads: 1000, conversions: 181 },
  { name: "Metro Mobile", calls: 1060, leads: 811, conversions: 142 },
  { name: "Cairo Services", calls: 940, leads: 720, conversions: 121 },
  { name: "Delta Markets", calls: 925, leads: 690, conversions: 111 },
];

const AGENT_BASE = [
  { name: "Mariam Hassan", calls: 486, conversions: 78, target: 80 },
  { name: "Omar Nabil", calls: 462, conversions: 72, target: 75 },
  { name: "Salma Adel", calls: 438, conversions: 69, target: 72 },
  { name: "Youssef Tarek", calls: 421, conversions: 63, target: 70 },
  { name: "Nour Samir", calls: 396, conversions: 58, target: 68 },
  { name: "Karim Mostafa", calls: 372, conversions: 53, target: 65 },
];

const number = new Intl.NumberFormat("en-US");
const CURRENT_MONTH = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const rate = (part: number, total: number) => (total ? (part / total) * 100 : 0);
const tick = { fontSize: 11, fill: "var(--muted-foreground)" };

function scaledRows<T extends { calls: number; conversions: number }>(rows: T[], monthIndex: number) {
  const factor = 0.91 + ((monthIndex * 7 + 3) % 17) / 100;
  return rows.map((row, index) => {
    const calls = Math.round(row.calls * factor * (1 + ((monthIndex + index) % 3) * 0.012));
    const conversions = Math.round(row.conversions * factor * (1 + ((monthIndex + index + 1) % 4) * 0.009));
    const leads = "leads" in row && typeof row.leads === "number"
      ? Math.round(row.leads * factor)
      : Math.round(calls * 0.78);
    return { ...row, calls, conversions, leads, conversionRate: rate(conversions, leads) };
  });
}

function monthlyTrend(monthIndex: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const index = monthIndex - 5 + i;
    const month = new Date(2025, 11 + index, 1);
    const seasonal = 0.83 + (((index + 24) * 7 + 5) % 19) / 100;
    const calls = Math.round(4205 * seasonal * (1 + i * 0.018));
    return {
      month: month.toLocaleDateString("en-US", { month: "short" }),
      calls,
      conversions: Math.round(calls * (0.112 + ((index + 30) % 5) * 0.004)),
    };
  });
}

function ReportTableView({ rows, kind }: { rows: any[]; kind: Exclude<TsMonthlyReportKind, "overview"> }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? rows.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(query))) : rows;
  }, [rows, search]);

  const columns = kind === "agents"
    ? ["Agent", "Calls", "Conversions", "Conversion rate", "Target", "Target achieved"]
    : [kind === "campaigns" ? "Campaign" : "Company", "Calls", "Leads reached", "Conversions", "Conversion rate"];
  const exportRows = filtered.map((row) => kind === "agents"
    ? { name: row.name, calls: row.calls, conversions: row.conversions, conversionRate: `${row.conversionRate.toFixed(1)}%`, target: row.target, targetAchieved: `${Math.min(100, Math.round((row.conversions / row.target) * 100))}%` }
    : { name: row.name, calls: row.calls, leads: row.leads, conversions: row.conversions, conversionRate: `${row.conversionRate.toFixed(1)}%` });

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">Monthly breakdown</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Ranked results for the selected month.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Search report rows" placeholder="Search this report" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <ExportButton rows={exportRows} filename={`ts-monthly-${kind}`} columns={[
            { label: columns[0], key: "name" },
            { label: "Calls", key: "calls" },
            ...(kind === "agents" ? [] : [{ label: "Leads reached", key: "leads" }]),
            { label: "Conversions", key: "conversions" },
            { label: "Conversion rate", key: "conversionRate" },
            ...(kind === "agents" ? [{ label: "Target", key: "target" }, { label: "Target achieved", key: "targetAchieved" }] : []),
          ]} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={columns.length} className="h-20 text-center text-muted-foreground">No matching results</TableCell></TableRow> : filtered.map((row, i) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{kind === "agents" ? <span className="inline-flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>{row.name}</span> : row.name}</TableCell>
                  <TableCell>{number.format(row.calls)}</TableCell>
                  {kind !== "agents" && <TableCell>{number.format(row.leads)}</TableCell>}
                  <TableCell className="font-semibold">{number.format(row.conversions)}</TableCell>
                  <TableCell>{row.conversionRate.toFixed(1)}%</TableCell>
                  {kind === "agents" && <>
                    <TableCell>{row.target}</TableCell>
                    <TableCell><Badge variant={row.conversions >= row.target ? "default" : "secondary"}>{Math.min(100, Math.round((row.conversions / row.target) * 100))}%</Badge></TableCell>
                  </>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function TsMonthlyReport({ kind }: { kind: TsMonthlyReportKind }) {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [campaign, setCampaign] = useState("all");
  const monthIndex = Math.max(0, (Number(month.slice(0, 4)) - 2025) * 12 + Number(month.slice(5, 7)) - 12);
  const title = TITLES[kind];
  const campaigns = scaledRows(CAMPAIGN_BASE, monthIndex);
  const companies = scaledRows(COMPANY_BASE, monthIndex);
  const agents = AGENT_BASE.map((agent, index) => {
    const factor = 0.91 + ((monthIndex * 7 + 3) % 17) / 100;
    const calls = Math.round(agent.calls * factor * (1 + ((monthIndex + index) % 3) * 0.012));
    const conversions = Math.round(agent.conversions * factor * (1 + ((monthIndex + index + 1) % 4) * 0.009));
    return { ...agent, calls, conversions, conversionRate: rate(conversions, calls) };
  }).sort((a, b) => b.conversions - a.conversions);
  const allCalls = campaigns.reduce((sum, row) => sum + row.calls, 0);
  const allConversions = campaigns.reduce((sum, row) => sum + row.conversions, 0);
  const allLeads = campaigns.reduce((sum, row) => sum + row.leads, 0);
  const trend = monthlyTrend(monthIndex);
  const campaignRows = campaign === "all" ? campaigns : campaigns.filter((row) => row.name === campaign);
  const campaignCalls = campaignRows.reduce((sum, row) => sum + row.calls, 0);
  const campaignConversions = campaignRows.reduce((sum, row) => sum + row.conversions, 0);
  const selectedMonth = MONTHS[monthIndex]?.label ?? "November 2026";
  const outcomeData = [
    { name: "Reached", value: Math.round(allCalls * 0.69) },
    { name: "No answer", value: Math.round(allCalls * 0.21) },
    { name: "Follow-up", value: Math.round(allCalls * 0.075) },
    { name: "Converted", value: allConversions },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">TeleSales intelligence</p>
            <Badge variant="outline">Illustrative demo data</Badge>
          </div>
          <h1 className="text-3xl font-semibold">{title.title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{title.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {kind === "campaigns" && <div className="space-y-1.5">
            <Label htmlFor="campaign-filter">Campaign</Label>
            <Select value={campaign} onValueChange={setCampaign}>
              <SelectTrigger id="campaign-filter" className="w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campaigns</SelectItem>
                {CAMPAIGN_BASE.map((row) => <SelectItem key={row.name} value={row.name}>{row.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>}
          <div className="space-y-1.5">
            <Label htmlFor="report-month">Report month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="report-month" className="w-[190px]"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {kind === "overview" && <ExportButton rows={campaigns} filename="ts-monthly-overview" columns={[
            { label: "Campaign", key: "name" }, { label: "Calls", key: "calls" }, { label: "Leads reached", key: "leads" }, { label: "Conversions", key: "conversions" }, { label: "Conversion rate", key: "conversionRate", format: (v) => `${Number(v).toFixed(1)}%` },
          ]} />}
        </div>
      </div>

      <nav aria-label="TeleSales monthly reports" className="flex flex-wrap gap-2">
        {REPORT_LINKS.map((entry) => <Button key={entry.kind} variant={entry.kind === kind ? "default" : "outline"} size="sm" asChild><Link to={entry.href}>{entry.title}</Link></Button>)}
      </nav>

      {kind === "overview" ? <>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard label="Calls handled" value={number.format(allCalls)} hint={`${selectedMonth} · all campaigns`} icon={Headset} />
          <KpiCard label="Leads reached" value={number.format(allLeads)} hint={`${rate(allLeads, allCalls).toFixed(1)}% contact rate`} icon={Users} tone="success" />
          <KpiCard label="Conversions" value={number.format(allConversions)} hint={`${rate(allConversions, allLeads).toFixed(1)}% of reached leads`} icon={Target} tone="success" />
          <KpiCard label="Campaigns" value={campaigns.length} hint={`${AGENT_BASE.length} agents reporting`} icon={Megaphone} tone="warning" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader><CardTitle className="text-base">Six-month activity trend</CardTitle><p className="text-sm text-muted-foreground">Calls and conversions through {selectedMonth}.</p></CardHeader>
            <CardContent><div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={tick} axisLine={false} tickLine={false} />
                <YAxis tick={tick} axisLine={false} tickLine={false} />
                <Tooltip /> <Legend />
                <Line type="monotone" dataKey="calls" name="Calls" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="conversions" name="Conversions" stroke="var(--chart-3)" strokeWidth={3} dot={false} />
              </LineChart></ResponsiveContainer>
            </div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Call outcome mix</CardTitle><p className="text-sm text-muted-foreground">Distribution across all active campaigns.</p></CardHeader>
            <CardContent><div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%"><PieChart>
                <Pie data={outcomeData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={104} paddingAngle={3}>
                  {outcomeData.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend verticalAlign="bottom" height={36} />
              </PieChart></ResponsiveContainer>
            </div></CardContent>
          </Card>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base">Campaign leaders</CardTitle><p className="mt-1 text-sm text-muted-foreground">Conversions by campaign this month.</p></div><Link to="/ts/reports/monthly/campaigns" className="text-sm font-medium text-primary">View report</Link></CardHeader>
            <CardContent><div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={campaigns} layout="vertical" margin={{ left: 4, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={tick} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={118} tick={tick} axisLine={false} tickLine={false} />
              <Tooltip /><Bar dataKey="conversions" name="Conversions" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
            </BarChart></ResponsiveContainer></div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base">Top agents</CardTitle><p className="mt-1 text-sm text-muted-foreground">Conversion performance this month.</p></div><Link to="/ts/reports/monthly/agents" className="text-sm font-medium text-primary">View report</Link></CardHeader>
            <CardContent className="space-y-4">{agents.slice(0, 5).map((agent, index) => <div key={agent.name} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{agent.name}</span><span className="text-sm font-semibold">{agent.conversions}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (agent.conversions / (agent.target * 1.2)) * 100)}%` }} /></div></div>
            </div>)}</CardContent>
          </Card>
        </div>
      </> : <>
        {kind === "campaigns" && <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiCard label="Campaign calls" value={number.format(campaignCalls)} icon={Headset} />
            <KpiCard label="Conversions" value={number.format(campaignConversions)} icon={Target} tone="success" />
            <KpiCard label="Campaigns active" value={campaignRows.length} icon={Megaphone} />
            <KpiCard label="Best conversion rate" value={`${Math.max(...campaignRows.map((row) => row.conversionRate)).toFixed(1)}%`} icon={TrendingUp} tone="success" />
          </div>
          <Card><CardHeader><CardTitle className="text-base">Campaign comparison · {selectedMonth}</CardTitle><p className="text-sm text-muted-foreground">Calls, reached leads, and conversions.</p></CardHeader><CardContent><div className="h-[320px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={campaignRows} margin={{ top: 8, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} /><YAxis tick={tick} axisLine={false} tickLine={false} /><Tooltip /><Legend />
            <Bar dataKey="calls" name="Calls" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /><Bar dataKey="leads" name="Reached" fill="var(--chart-2)" radius={[4, 4, 0, 0]} /><Bar dataKey="conversions" name="Conversions" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer></div></CardContent></Card>
          <ReportTableView rows={campaignRows} kind="campaigns" />
        </>}
        {kind === "companies" && <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiCard label="Companies" value={companies.length} icon={Building2} />
            <KpiCard label="Leads reached" value={number.format(companies.reduce((sum, row) => sum + row.leads, 0))} icon={Users} tone="success" />
            <KpiCard label="Conversions" value={number.format(companies.reduce((sum, row) => sum + row.conversions, 0))} icon={Target} tone="success" />
            <KpiCard label="Best company rate" value={`${Math.max(...companies.map((row) => row.conversionRate)).toFixed(1)}%`} icon={TrendingUp} />
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Card><CardHeader><CardTitle className="text-base">Company conversion performance</CardTitle><p className="text-sm text-muted-foreground">Reached leads compared with completed conversions.</p></CardHeader><CardContent><div className="h-[320px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={companies} margin={{ top: 8, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} /><YAxis tick={tick} axisLine={false} tickLine={false} /><Tooltip /><Legend />
              <Bar dataKey="leads" name="Leads reached" fill="var(--chart-2)" radius={[4, 4, 0, 0]} /><Bar dataKey="conversions" name="Conversions" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
            </BarChart></ResponsiveContainer></div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Share of conversions</CardTitle><p className="text-sm text-muted-foreground">Contribution by company source.</p></CardHeader><CardContent><div className="h-[320px] w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={companies} dataKey="conversions" nameKey="name" innerRadius={65} outerRadius={104} paddingAngle={3}>{companies.map((row, index) => <Cell key={row.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={48} /></PieChart></ResponsiveContainer></div></CardContent></Card>
          </div>
          <ReportTableView rows={companies} kind="companies" />
        </>}
        {kind === "agents" && <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiCard label="Agents reporting" value={agents.length} icon={Users} />
            <KpiCard label="Calls handled" value={number.format(agents.reduce((sum, row) => sum + row.calls, 0))} icon={Headset} />
            <KpiCard label="Conversions" value={number.format(agents.reduce((sum, row) => sum + row.conversions, 0))} icon={Target} tone="success" />
            <KpiCard label="Targets achieved" value={`${agents.filter((row) => row.conversions >= row.target).length} / ${agents.length}`} icon={Activity} tone="warning" />
          </div>
          <Card><CardHeader><CardTitle className="text-base">Agent leaderboard · {selectedMonth}</CardTitle><p className="text-sm text-muted-foreground">Conversions ranked highest to lowest.</p></CardHeader><CardContent><div className="h-[340px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={agents} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} /><XAxis type="number" tick={tick} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={128} tick={tick} axisLine={false} tickLine={false} /><Tooltip /><Legend /><Bar dataKey="conversions" name="Conversions" fill="var(--chart-3)" radius={[0, 4, 4, 0]} /><Bar dataKey="target" name="Monthly target" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
          </BarChart></ResponsiveContainer></div></CardContent></Card>
          <ReportTableView rows={agents} kind="agents" />
        </>}
      </>}
    </div>
  );
}
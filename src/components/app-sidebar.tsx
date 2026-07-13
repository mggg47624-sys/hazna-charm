import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Phone,
  Clock,
  Users,
  UserCog,
  Upload,
  ListChecks,
  CheckSquare,
  TrendingUp,
  UserCheck,
  Users2,
  FileSpreadsheet,
  KeyRound,
  LogOut,
  Shield,
  Megaphone,
  ClipboardList,
  History,
  AlertTriangle,
  ScrollText,
  PhoneCall,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, useRoleLabel, useIsAgent, useCanAccess } from "@/lib/auth";
import { permissionsFor, type Section } from "@/lib/permissions";

type Item = { title: string; url: string; icon: any; section: Section };

const groups: { label: string; items: Item[] }[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, section: "dashboard" },
    ],
  },
  // QA
  {
    label: "QA — Workspace",
    items: [
      { title: "Work Queue", url: "/qa/work", icon: Phone, section: "qa:agent" },
      { title: "Call Later", url: "/qa/call-later", icon: Clock, section: "qa:agent" },
      { title: "Call History", url: "/qa/call-history", icon: History, section: "qa:call-history" },
    ],
  },
  {
    label: "QA — Administration",
    items: [
      { title: "Users", url: "/qa/admin/users", icon: Users, section: "qa:admin" },
      { title: "Sales Reps", url: "/qa/admin/sales-reps", icon: UserCog, section: "qa:admin" },
      { title: "Import Data", url: "/qa/admin/import", icon: Upload, section: "qa:admin" },
    ],
  },
  {
    label: "QA — Reports",
    items: [
      { title: "Customers", url: "/qa/reports/customers", icon: ListChecks, section: "qa:reports" },
      { title: "Sales Reps", url: "/qa/reports/sales-reps", icon: TrendingUp, section: "qa:reports" },
      { title: "Evaluations", url: "/qa/reports/evaluations", icon: CheckSquare, section: "qa:reports" },
      { title: "Batches", url: "/qa/reports/batches", icon: FileSpreadsheet, section: "qa:reports" },
      { title: "Calls", url: "/qa/reports/calls", icon: Phone, section: "qa:reports" },
      { title: "QA Agents", url: "/qa/reports/agents", icon: UserCheck, section: "qa:reports" },
      { title: "Teams", url: "/qa/reports/teams", icon: Users2, section: "qa:reports" },
    ],
  },
  // TS
  {
    label: "TeleSales — Workspace",
    items: [
      { title: "Work Queue", url: "/ts/work", icon: PhoneCall, section: "ts:agent" },
      { title: "Call Later", url: "/ts/call-later", icon: Clock, section: "ts:agent" },
      { title: "Call History", url: "/ts/call-history", icon: History, section: "ts:call-history" },
      { title: "My Warnings", url: "/ts/my-warnings", icon: AlertTriangle, section: "ts:my-warnings" },
    ],
  },
  {
    label: "TeleSales — Administration",
    items: [
      { title: "Campaigns", url: "/ts/admin/campaigns", icon: Megaphone, section: "ts:admin" },
      { title: "Batches", url: "/ts/admin/batches", icon: FileSpreadsheet, section: "ts:admin" },
      { title: "Users", url: "/ts/admin/users", icon: Users, section: "ts:admin" },
      { title: "Warnings", url: "/ts/admin/warnings", icon: AlertTriangle, section: "ts:warnings" },
      { title: "Audit Log", url: "/ts/admin/audit-log", icon: ScrollText, section: "ts:audit" },
    ],
  },
  {
    label: "TeleSales — Reports",
    items: [
      { title: "Calls", url: "/ts/reports/calls", icon: Phone, section: "ts:reports" },
      { title: "Agents", url: "/ts/reports/agents", icon: UserCheck, section: "ts:reports" },
      { title: "Leads", url: "/ts/reports/leads", icon: ClipboardList, section: "ts:reports" },
    ],
  },
  // Manager (read-only)
  {
    label: "Manager — Overview",
    items: [
      { title: "Executive Dashboard", url: "/manager", icon: LayoutDashboard, section: "manager:dashboard" },
    ],
  },
  {
    label: "Manager — TeleSales",
    items: [
      { title: "Campaigns", url: "/manager/ts/campaigns", icon: Megaphone, section: "manager:ts" },
      { title: "Calls", url: "/manager/ts/calls", icon: Phone, section: "manager:ts" },
      { title: "Leads", url: "/manager/ts/leads", icon: ClipboardList, section: "manager:ts" },
      { title: "Agents", url: "/manager/ts/agents", icon: UserCheck, section: "manager:ts" },
      { title: "Batches", url: "/manager/ts/batches", icon: FileSpreadsheet, section: "manager:ts" },
    ],
  },
  {
    label: "Manager — Quality Assurance",
    items: [
      { title: "Calls", url: "/manager/qa/calls", icon: Phone, section: "manager:qa" },
      { title: "Evaluations", url: "/manager/qa/evaluations", icon: CheckSquare, section: "manager:qa" },
      { title: "Customers", url: "/manager/qa/customers", icon: ListChecks, section: "manager:qa" },
      { title: "Sales Reps", url: "/manager/qa/sales-reps", icon: TrendingUp, section: "manager:qa" },
      { title: "QA Agents", url: "/manager/qa/agents", icon: UserCheck, section: "manager:qa" },
      { title: "Teams", url: "/manager/qa/teams", icon: Users2, section: "manager:qa" },
      { title: "Batches", url: "/manager/qa/batches", icon: FileSpreadsheet, section: "manager:qa" },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout } = useAuth();
  const agentOnly = useIsAgent();
  const roleLabel = useRoleLabel();

  // Compute per-section access once, in a stable order (no conditional hook calls).
  const perms = new Set(permissionsFor(user?.roleId));
  // Also react to auth-context changes even before permissions memo populates.
  void useCanAccess("dashboard");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Khazna Portal</span>
              <span className="text-xs text-muted-foreground">QA & TeleSales</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((g) => {
          const visible = g.items.filter((i) => perms.has(i.section));
          if (!visible.length) return null;
          return (
            <SidebarGroup key={g.label}>
              <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visible.map((item) => {
                    const active =
                      item.url === "/" ? path === "/" : path.startsWith(item.url);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link to={item.url}>
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          {!agentOnly && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/settings/change-password">
                  <KeyRound className="h-4 w-4" />
                  {!collapsed && <span>Change Password</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && user && (
          <div className="px-2 py-2 text-xs text-muted-foreground border-t mt-1">
            <div className="font-medium text-foreground truncate">
              {user.fullName || user.userName || user.email}
            </div>
            <div>{roleLabel}</div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

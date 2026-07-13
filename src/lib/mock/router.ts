/**
 * Mock backend router. Called from `src/lib/api.ts` before the real fetch
 * whenever `import.meta.env.DEV` is true. Return `undefined` from
 * `handleMock` to fall through to the real network.
 */
import * as db from "./data";
import type { ApiInit } from "../api";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

type Handler = (
  method: string,
  path: string,
  init: ApiInit,
  match: RegExpMatchArray,
) => Promise<unknown> | unknown;

interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
}

const state: {
  users: any[];
  salesReps: any[];
  campaigns: any[];
  batches: any[];
  warnings: any[];
  referrals: any[];
  nextId: number;
} = {
  users: db.users.map((u) => ({ ...u })),
  salesReps: db.salesReps.map((r) => ({ ...r })),
  campaigns: db.campaigns.map((c) => ({ ...c })),
  batches: db.tsBatches.map((b) => ({ ...b })),
  warnings: db.tsWarnings.map((w) => ({ ...w })),
  referrals: [],
  nextId: 90000,
};

const ok = <T,>(data: T) => data;

// Decode any %20 or literal-space paths uniformly.
const dec = (s: string) => decodeURIComponent(s);

const routes: Route[] = [
  // ---- Auth ----
  { method: "POST", pattern: /^\/api\/(auth|Auth)\/Login$/, handler: () => ({ token: "mock-token-dev" }) },
  { method: "POST", pattern: /^\/api\/(auth|Auth)\/reset-password$/, handler: () => ({ success: true }) },
  { method: "POST", pattern: /^\/api\/users\/change-password$/, handler: () => ({ success: true }) },
  { method: "POST", pattern: /^\/api\/Auth\/ChangePassword$/, handler: () => ({ success: true }) },
  { method: "GET", pattern: /^\/api\/(users\/me|User\/Me)$/, handler: () => db.currentUser },

  // ---- Users (new + legacy paths) ----
  { method: "GET", pattern: /^\/api\/users\/Get(%20|\s)All(%20|\s)Users$/, handler: () => ok(state.users) },
  { method: "GET", pattern: /^\/api\/User$/, handler: () => ok(state.users) },
  { method: "POST", pattern: /^\/api\/users\/Add(%20|\s)New(%20|\s)User$/, handler: (_m, _p, init) => addUser(init) },
  { method: "POST", pattern: /^\/api\/User$/, handler: (_m, _p, init) => addUser(init) },
  { method: "PUT", pattern: /^\/api\/users\/(\d+)\/Edit(%20|\s)User$/, handler: (_m, _p, init, match) => editUser(Number(match[1]), init) },
  { method: "PUT", pattern: /^\/api\/User\/(\d+)$/, handler: (_m, _p, init, match) => editUser(Number(match[1]), init) },
  { method: "PATCH", pattern: /^\/api\/users\/(\d+)\/ToggleActive$/, handler: (_m, _p, _i, match) => toggleUser(Number(match[1])) },
  { method: "PATCH", pattern: /^\/api\/User\/(\d+)\/ToggleActive$/, handler: (_m, _p, _i, match) => toggleUser(Number(match[1])) },
  { method: "PATCH", pattern: /^\/api\/User\/(\d+)\/ResetPassword$/, handler: () => ({ success: true }) },
  { method: "DELETE", pattern: /^\/api\/users\/(\d+)$/, handler: (_m, _p, _i, match) => { state.users = state.users.filter((u) => u.id !== Number(match[1])); return { success: true }; } },

  // ---- SalesRep ----
  { method: "GET", pattern: /^\/api\/SalesRep(\/GetAll)?$/, handler: () => ok(state.salesReps) },
  { method: "GET", pattern: /^\/api\/SalesRep\/TeamLeaders$/, handler: () => db.teamLeaders },
  { method: "GET", pattern: /^\/api\/SalesRep\/ByKhaznaId$/, handler: (_m, _p, init) => state.salesReps.find((r) => r.khaznaId === init.query?.khaznaId) },
  { method: "GET", pattern: /^\/api\/SalesRep\/(\d+)\/GetById$/, handler: (_m, _p, _i, m) => state.salesReps.find((r) => r.id === Number(m[1])) },
  { method: "POST", pattern: /^\/api\/SalesRep(\/Add)?$/, handler: (_m, _p, init) => addRep(init) },
  { method: "PUT", pattern: /^\/api\/SalesRep\/(\d+)(\/Edit)?$/, handler: (_m, _p, init, match) => editRep(Number(match[1]), init) },
  { method: "PATCH", pattern: /^\/api\/SalesRep\/(\d+)\/ToggleActive$/, handler: (_m, _p, _i, match) => toggleRep(Number(match[1])) },

  // ---- Lookups (new spaced paths) ----
  { method: "GET", pattern: /^\/api\/Lookup\/Get(%20|\s)Roles$/, handler: () => db.roles },
  { method: "GET", pattern: /^\/api\/Lookup\/Roles$/, handler: () => db.roles },
  { method: "GET", pattern: /^\/api\/Lookup\/Call(%20|\s)Results$/, handler: () => db.callResults },
  { method: "GET", pattern: /^\/api\/Lookup\/CallResults$/, handler: () => db.callResults },
  { method: "GET", pattern: /^\/api\/Lookup\/Transaction(%20|\s)Types$/, handler: () => db.transactionTypes },
  { method: "GET", pattern: /^\/api\/Lookup\/TransactionTypes$/, handler: () => db.transactionTypes },
  { method: "GET", pattern: /^\/api\/Lookup\/Customer(%20|\s)Statuses$/, handler: () => db.customerStatuses },
  { method: "GET", pattern: /^\/api\/Lookup\/CustomerStatuses$/, handler: () => db.customerStatuses },
  { method: "GET", pattern: /^\/api\/Lookup\/QA(%20|\s)Team(%20|\s)Leaders$/, handler: () => db.teamLeaders },
  { method: "GET", pattern: /^\/api\/Lookup\/TS(%20|\s)Team(%20|\s)Leaders$/, handler: () => db.tsTeamLeaders },
  { method: "GET", pattern: /^\/api\/Lookup\/TeamLeaders$/, handler: () => db.teamLeaders },

  // ---- QA Reports ----
  { method: "GET", pattern: /^\/api\/Report\/Calls$/, handler: () => db.calls },
  { method: "GET", pattern: /^\/api\/Report\/Customers$/, handler: () => db.customers },
  { method: "GET", pattern: /^\/api\/Report\/Evaluations$/, handler: () => db.evaluations },
  { method: "GET", pattern: /^\/api\/Report\/Evaluations\/(\d+)$/, handler: (_m, _p, _i, m) => ({ ...db.evaluations[Number(m[1]) % db.evaluations.length], answers: [] }) },
  { method: "GET", pattern: /^\/api\/Report\/SalesReps$/, handler: () => db.reportSalesReps },
  { method: "GET", pattern: /^\/api\/Report\/Agents$/, handler: () => db.reportAgents },
  { method: "GET", pattern: /^\/api\/Report\/Teams$/, handler: () => db.reportTeams },
  { method: "GET", pattern: /^\/api\/Report\/Batches$/, handler: () => db.reportBatches },

  // ---- Agent Stats ----
  { method: "GET", pattern: /^\/api\/AgentStats\/Today$/, handler: () => db.agentStatsSummary(1) },
  { method: "GET", pattern: /^\/api\/AgentStats\/Month$/, handler: () => db.agentStatsSummary(20) },
  { method: "GET", pattern: /^\/api\/AgentStats\/Range$/, handler: () => db.agentStatsSummary(7) },
  { method: "GET", pattern: /^\/api\/AgentStats\/Daily$/, handler: (_m, _p, init) => db.agentDaily((init.query?.date as string) || undefined) },

  // ---- QA Queue / Calls ----
  { method: "GET", pattern: /^\/api\/Queue\/NextLead$/, handler: () => db.nextLead() },
  { method: "GET", pattern: /^\/api\/Queue\/CallLater$/, handler: () => db.callLater },
  { method: "POST", pattern: /^\/api\/Queue\/PickFromCallLater\/(\d+)$/, handler: () => db.nextLead() },
  { method: "POST", pattern: /^\/api\/Call\/Submit$/, handler: () => submitCall() },

  // ---- Import ----
  { method: "POST", pattern: /^\/api\/Import$/, handler: () => importSummary() },

  // ==================== TeleSales ====================
  // Campaigns
  { method: "GET", pattern: /^\/api\/ts\/Campaign$/, handler: () => state.campaigns },
  { method: "GET", pattern: /^\/api\/ts\/Campaign\/(\d+)$/, handler: (_m, _p, _i, m) => state.campaigns.find((c) => c.id === Number(m[1])) },
  { method: "POST", pattern: /^\/api\/ts\/Campaign$/, handler: (_m, _p, init) => addCampaign(init) },
  { method: "PUT", pattern: /^\/api\/ts\/Campaign\/Edit\/(\d+)$/, handler: (_m, _p, init, m) => editCampaign(Number(m[1]), init) },
  { method: "PATCH", pattern: /^\/api\/ts\/Campaign\/ToggleActive\/(\d+)$/, handler: (_m, _p, _i, m) => toggleCampaign(Number(m[1])) },
  { method: "GET", pattern: /^\/api\/ts\/Campaign\/Availability$/, handler: () => state.campaigns.filter((c) => c.isActive) },
  { method: "GET", pattern: /^\/api\/ts\/Campaign\/Agents\/(\d+)$/, handler: () => db.users.filter((u) => u.roleId === 5) },
  { method: "POST", pattern: /^\/api\/ts\/Campaign\/Agents\/Toggle\/(\d+)$/, handler: () => ({ success: true }) },
  { method: "GET", pattern: /^\/api\/ts\/Campaign\/CallResults\/(\d+)$/, handler: () => db.callResults },

  // Forms
  { method: "GET", pattern: /^\/api\/ts\/Form\/ByCampaign\/(\d+)$/, handler: (_m, _p, _i, m) => db.tsForms.find((f) => f.campaignId === Number(m[1])) ?? null },
  { method: "GET", pattern: /^\/api\/ts\/Form\/ById\/(\d+)$/, handler: (_m, _p, _i, m) => db.tsForms.find((f) => f.id === Number(m[1])) ?? null },
  { method: "GET", pattern: /^\/api\/ts\/Form\/Questions\/(\d+)$/, handler: (_m, _p, _i, m) => db.tsForms.find((f) => f.id === Number(m[1]))?.questions ?? [] },
  { method: "POST", pattern: /^\/api\/ts\/Form\/AddForm$/, handler: () => ({ success: true }) },
  { method: "POST", pattern: /^\/api\/ts\/Form\/AddQuestion$/, handler: () => ({ success: true }) },
  { method: "POST", pattern: /^\/api\/ts\/Form\/AddOption$/, handler: () => ({ success: true }) },
  { method: "PUT", pattern: /^\/api\/ts\/Form\/EditForm\/(\d+)$/, handler: () => ({ success: true }) },
  { method: "PUT", pattern: /^\/api\/ts\/Form\/EditQuestion\/(\d+)$/, handler: () => ({ success: true }) },
  { method: "PUT", pattern: /^\/api\/ts\/Form\/EditOption\/(\d+)$/, handler: () => ({ success: true }) },
  { method: "DELETE", pattern: /^\/api\/ts\/Form\/Delete\/(\d+)$/, handler: () => ({ success: true }) },

  // Batches
  { method: "GET", pattern: /^\/api\/ts\/Batch$/, handler: () => state.batches },
  { method: "GET", pattern: /^\/api\/ts\/Batch\/ByCampaign\/(\d+)$/, handler: (_m, _p, _i, m) => state.batches.filter((b) => b.campaignId === Number(m[1])) },
  { method: "GET", pattern: /^\/api\/ts\/Batch\/GetById\/(\d+)$/, handler: (_m, _p, _i, m) => ({
      ...(state.batches.find((b) => b.id === Number(m[1])) ?? {}),
      leads: db.tsLeads.filter((l) => l.batchId === Number(m[1])),
    }) },
  { method: "POST", pattern: /^\/api\/ts\/Batch$/, handler: (_m, _p, init) => addBatch(init) },
  { method: "POST", pattern: /^\/api\/ts\/Batch\/ConfirmDuplicates$/, handler: () => ({ success: true }) },
  { method: "PUT", pattern: /^\/api\/ts\/Batch\/EditLead\/(\d+)$/, handler: () => ({ success: true }) },
  { method: "POST", pattern: /^\/api\/ts\/Batch\/(\d+)\/Agents\/(\d+)$/, handler: () => ({ success: true }) },

  // Queue
  { method: "GET", pattern: /^\/api\/ts\/Queue\/NextLead$/, handler: (_m, _p, init) => db.tsNextLead(init.query?.campaignId ? Number(init.query.campaignId) : undefined) },
  { method: "GET", pattern: /^\/api\/ts\/Queue\/CallLater$/, handler: () => db.tsLeads.slice(0, 6).map((l) => ({ ...l, scheduledAt: new Date(Date.now() + 3600000).toISOString() })) },
  { method: "POST", pattern: /^\/api\/ts\/Queue\/PickFromCallLater\/(\d+)$/, handler: () => db.tsNextLead() },
  { method: "POST", pattern: /^\/api\/ts\/Queue\/Submit$/, handler: () => ({ status: "ok", callId: Math.floor(Math.random() * 100000) }) },
  {
    method: "POST",
    pattern: /^\/api\/ts\/Queue\/addReferral$/,
    handler: (_m, _p, init) => {
      const body = (init.body as any) || {};
      const created = {
        id: state.nextId++,
        batchId: 0,
        customerName: body.customerName || "Referral",
        phone: body.phone || "",
        companyName: body.companyName || "",
        notes: body.notes || "",
        status: "new",
        isReferral: true,
        createdAt: new Date().toISOString(),
      };
      state.referrals.push(created);
      return created;
    },
  },

  // Reports
  { method: "GET", pattern: /^\/api\/ts\/Report\/Calls\/(\d+)$/, handler: (_m, _p, _i, m) => db.tsReportCalls(Number(m[1])) },
  { method: "GET", pattern: /^\/api\/ts\/Report\/AgentStats\/(\d+)$/, handler: (_m, _p, _i, m) => db.tsReportAgents(Number(m[1])) },
  { method: "GET", pattern: /^\/api\/ts\/Report\/Leads\/(\d+)$/, handler: (_m, _p, _i, m) => db.tsReportLeads(Number(m[1])) },

  // Agent Report
  { method: "GET", pattern: /^\/api\/ts\/AgentReport\/Today$/, handler: () => db.agentStatsSummary(1) },
  { method: "GET", pattern: /^\/api\/ts\/AgentReport\/Date$/, handler: () => db.agentStatsSummary(1) },
  { method: "GET", pattern: /^\/api\/ts\/AgentReport\/(\d+)$/, handler: () => db.agentStatsSummary(1) },

  // Warnings
  { method: "GET", pattern: /^\/api\/ts\/Warning\/GetAll$/, handler: () => state.warnings },
  { method: "GET", pattern: /^\/api\/ts\/Warning\/MyWarning$/, handler: () => state.warnings.slice(0, 2) },
  { method: "GET", pattern: /^\/api\/ts\/Warning\/Target$/, handler: () => state.warnings },
  { method: "POST", pattern: /^\/api\/ts\/Warning\/Generate$/, handler: (_m, _p, init) => {
      const body = (init.body as any) || {};
      const target = state.users.find((u) => u.id === Number(body.targetUserId));
      const created = {
        id: state.nextId++,
        targetUserId: Number(body.targetUserId) || 0,
        targetUserName: target?.fullName || "Agent",
        reason: body.reason || "",
        severity: body.severity || "medium",
        status: "open",
        createdBy: "Mock TS Admin",
        createdAt: new Date().toISOString(),
      };
      state.warnings.unshift(created);
      return created;
    } },
  { method: "POST", pattern: /^\/api\/ts\/Warning\/Action\/(\d+)$/, handler: (_m, _p, init, m) => {
      const w = state.warnings.find((x) => x.id === Number(m[1]));
      if (w) w.status = (init.body as any)?.status || "acknowledged";
      return w;
    } },
  { method: "POST", pattern: /^\/api\/ts\/Warning\/Reply\/(\d+)$/, handler: (_m, _p, init, m) => {
      const w = state.warnings.find((x) => x.id === Number(m[1]));
      if (w) w.reply = (init.body as any)?.reply || "";
      return w;
    } },

  // Audit + Validation
  { method: "GET", pattern: /^\/api\/ts\/AuditLog$/, handler: () => db.tsAuditLog },
  { method: "POST", pattern: /^\/api\/ts\/Validation\/(\d+)$/, handler: () => ({ success: true, valid: true }) },
];

function addUser(init: ApiInit) {
  const body = (init.body as any) || {};
  const role = db.roles.find((r) => r.id === Number(body.roleId));
  const created = {
    id: state.nextId++,
    fullName: body.fullName || "New User",
    email: body.email || "",
    roleId: Number(body.roleId) || 3,
    roleName: role?.nameEn || role?.name || "",
    teamLeaderId: body.teamLeaderId ?? null,
    teamLeaderName: db.teamLeaders.find((t) => t.id === body.teamLeaderId)?.fullName ?? null,
    isActive: true,
  };
  state.users.push(created);
  return created;
}
function editUser(id: number, init: ApiInit) {
  const body = (init.body as any) || {};
  const u = state.users.find((x) => x.id === id);
  if (u) Object.assign(u, body, { id });
  return u ?? { id };
}
function toggleUser(id: number) {
  const u = state.users.find((x) => x.id === id);
  if (u) u.isActive = !u.isActive;
  return u ?? {};
}
function addRep(init: ApiInit) {
  const body = (init.body as any) || {};
  const tl = db.teamLeaders.find((t) => t.id === body.teamLeaderId);
  const created = {
    id: state.nextId++,
    khaznaId: body.khaznaId || `KH-${state.nextId}`,
    fullName: body.fullName || "New Rep",
    phone: body.phone || "",
    whatsapp: body.whatsapp || "",
    email: body.email || "",
    teamLeaderId: body.teamLeaderId ?? null,
    teamLeaderName: tl?.fullName ?? null,
    roleId: body.roleId ?? 5,
    roleName: db.roles.find((r) => r.id === body.roleId)?.nameEn || "Sales Rep",
    isActive: true,
  };
  state.salesReps.push(created);
  return created;
}
function editRep(id: number, init: ApiInit) {
  const body = (init.body as any) || {};
  const r = state.salesReps.find((x) => x.id === id);
  if (r) {
    const tl = db.teamLeaders.find((t) => t.id === body.teamLeaderId);
    Object.assign(r, body, { id, teamLeaderName: tl?.fullName ?? r.teamLeaderName });
  }
  return r ?? { id };
}
function toggleRep(id: number) {
  const r = state.salesReps.find((x) => x.id === id);
  if (r) r.isActive = !r.isActive;
  return r ?? {};
}
function submitCall() {
  return {
    status: "ok",
    callAttemptId: Math.floor(Math.random() * 10000),
    evaluationId: Math.floor(Math.random() * 10000),
    totalScore: 70 + Math.floor(Math.random() * 30),
  };
}
function importSummary() {
  return {
    totalRows: 120,
    validRows: 110,
    duplicateRows: 8,
    errorRows: 2,
    errors: [
      { row: 15, message: "Invalid phone number format" },
      { row: 47, message: "Missing Khazna ID" },
    ],
  };
}
function addCampaign(init: ApiInit) {
  const body = (init.body as any) || {};
  const created = {
    id: state.nextId++,
    name: body.name || "New Campaign",
    description: body.description || "",
    startDate: body.startDate,
    endDate: body.endDate,
    isActive: true,
    leadsCount: 0,
    agentsCount: 0,
    progress: 0,
  };
  state.campaigns.push(created);
  return created;
}
function editCampaign(id: number, init: ApiInit) {
  const body = (init.body as any) || {};
  const c = state.campaigns.find((x) => x.id === id);
  if (c) Object.assign(c, body, { id });
  return c ?? { id };
}
function toggleCampaign(id: number) {
  const c = state.campaigns.find((x) => x.id === id);
  if (c) c.isActive = !c.isActive;
  return c ?? {};
}
function addBatch(init: ApiInit) {
  const body = (init.body as any) || {};
  const c = state.campaigns.find((x) => x.id === Number(body.campaignId));
  const created = {
    id: state.nextId++,
    campaignId: Number(body.campaignId) || 0,
    campaignName: c?.name,
    name: body.name || `Batch ${state.nextId}`,
    uploadedBy: "Mock TS Admin",
    uploadedAt: new Date().toISOString(),
    totalLeads: body.totalLeads ?? 100,
    processedLeads: 0,
    duplicateLeads: 0,
    status: "ready",
  };
  state.batches.push(created);
  return created;
}

export async function handleMock(
  path: string,
  init: ApiInit,
): Promise<{ handled: true; value: unknown } | undefined> {
  const method = (init.method || "GET").toUpperCase();
  const clean = path.split("?")[0];
  const decoded = dec(clean);
  const route = routes.find(
    (r) => r.method === method && (r.pattern.test(clean) || r.pattern.test(decoded)),
  );
  if (!route) return undefined;
  await delay();
  const match = (clean.match(route.pattern) || decoded.match(route.pattern))!;
  const value = await route.handler(method, clean, init, match);
  // eslint-disable-next-line no-console
  console.debug(`[mock] ${method} ${path}`, value);
  return { handled: true, value };
}

export const MOCK_ENABLED = import.meta.env.DEV;

// Consumer Finance API hooks. In mock mode (VITE_CF_MOCK !== "false") every hook
// is served from the in-memory store in ./cf-mock and mutations just succeed.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import {
  CF_MOCK,
  type CfAdminDashboard, type CfAdminRegistrationRow, type CfAgentRegistration, type CfAgentRow, type CfBatch,
  type CfCheckResult, type CfCounts, type CfCustomer, type CfHistoryItem, type CfImportSummary,
  type CfOpsDashboard, type CfQueueItem, type CfReason, type CfRegistrationDetail, type CfTeamSummary, type Paged,
} from "./cf-types";
import * as M from "./cf-mock";

const BASE = "/api/consumer-finance";
type Q = Record<string, string | number | boolean | undefined | null>;

const wait = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), ms));
const fail = (msg: string) => new Promise<never>((_, rej) => setTimeout(() => rej(new Error(msg)), 250));

function toPaged<T>(d: Paged<T> | T[] | undefined, p = 1): Paged<T> {
  if (Array.isArray(d)) return { items: d, total: d.length, page: p, pageSize: d.length || 10 };
  return d ?? { items: [], total: 0, page: p, pageSize: 10 };
}

function useCf<T>(key: unknown[], path: string, mock: () => T, query?: Q, enabled = true) {
  return useQuery({
    queryKey: ["cf", ...key, query ?? {}],
    queryFn: () => (CF_MOCK ? wait(mock()) : api<T>(`${BASE}${path}`, { query })),
    enabled,
  });
}
function usePaged<T>(key: unknown[], path: string, mock: (q: Q) => Paged<T>, query: Q) {
  const r = useCf<Paged<T> | T[]>(key, path, () => mock(query), query);
  return { ...r, data: r.data ? toPaged(r.data, Number(query.page ?? 1)) : undefined };
}
function useCfMutation<V, R = unknown>(fn: (v: V) => Promise<R>, mock: (v: V) => R | Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: V) => (CF_MOCK ? Promise.resolve(mock(v)).then((x) => wait(x)) : fn(v)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cf"] }),
  });
}

const textMatch = (s: string | undefined, q: Q) => {
  const term = String(q.search ?? "").toLowerCase();
  return !term || (s ?? "").toLowerCase().includes(term);
};

// ===================== Agent (role 1) =====================
export const useCfAgentDashboard = () =>
  useCf<CfCounts>(["agent", "dashboard"], "/agent/dashboard", () =>
    M.counts(M.db.regs.filter((r) => r.agentId === M.MOCK_AGENT_ID)));

export const useCfAgentRegistrations = (query: { search?: string; status?: string; page?: number }) =>
  usePaged<CfAgentRow>(["agent", "registrations"], "/agent/registrations", (q) => {
    const rows = M.db.regs
      .filter((r) => r.agentId === M.MOCK_AGENT_ID)
      .filter((r) => !q.status || String(r.status) === String(q.status))
      .map((r): CfAgentRow => {
        const last = r.rounds[r.rounds.length - 1];
        return {
          id: r.id, customerName: M.customerOf(r).customerName, createdAt: r.createdAt, status: r.status,
          rejectionNote: r.status === 3 ? last?.note : null, rejectionReasons: r.status === 3 ? last?.reasons : [],
        };
      })
      .filter((r) => textMatch(r.customerName, q))
      .reverse();
    return M.page(rows, Number(q.page ?? 1));
  }, query);

export const useCfAgentRegistration = (id: number) =>
  useCf<CfAgentRegistration>(["agent", "registration", id], `/agent/registrations/${id}`, () => {
    const r = M.db.regs.find((x) => x.id === id);
    if (!r) throw new Error("Registration not found");
    const last = r.rounds[r.rounds.length - 1];
    return {
      id: r.id, nationalId: r.nationalId, khaznaMobile: r.khaznaMobile, idExpirationDate: r.idExpirationDate,
      amount: r.amount, channelId: r.channelId, status: r.status, files: r.files,
      latestRejection: last?.decision === "reject" ? { reasons: last.reasons, note: last.note, reviewedAt: last.reviewedAt } : null,
    };
  });

export const useCfCheckNationalId = () =>
  useCfMutation<string, CfCheckResult>(
    (nationalId) => api(`${BASE}/agent/check-national-id`, { method: "POST", body: { nationalId } }),
    (nationalId) => {
      const reg = M.db.regs.find((r) => r.nationalId === nationalId);
      if (reg) return reg.status === 3 && reg.agentId === M.MOCK_AGENT_ID ? { result: 3, registrationId: reg.id } : { result: 2 };
      return M.db.customers.some((c) => c.nationalId === nationalId) ? { result: 1 } : { result: 0 };
    },
  );

export const useCfCreateRegistration = () =>
  useCfMutation<FormData>(
    (fd) => api(`${BASE}/agent/registrations`, { method: "POST", body: fd, isForm: true }),
    (fd) => {
      const nationalId = String(fd.get("nationalId"));
      if (M.db.regs.some((r) => r.nationalId === nationalId)) throw new Error("Customer is already registered");
      const now = new Date().toISOString();
      M.db.regs.push({
        id: 1001 + M.db.regs.length, nationalId, agentId: M.MOCK_AGENT_ID, channelId: Number(fd.get("channelId")),
        khaznaMobile: String(fd.get("khaznaMobile")), idExpirationDate: String(fd.get("idExpirationDate")),
        amount: Number(fd.get("amount")), status: 1, createdAt: now, files: M.filesFromForm(fd, []), rounds: [],
        statusHistory: [{ status: 1, changedAt: now, changedByName: M.agentName(M.MOCK_AGENT_ID) }],
      });
      return true;
    },
  );

export const useCfUpdateRegistration = (id: number) =>
  useCfMutation<FormData>(
    (fd) => api(`${BASE}/agent/registrations/${id}`, { method: "PUT", body: fd, isForm: true }),
    (fd) => {
      const r = M.db.regs.find((x) => x.id === id)!;
      Object.assign(r, {
        khaznaMobile: String(fd.get("khaznaMobile")), idExpirationDate: String(fd.get("idExpirationDate")),
        amount: Number(fd.get("amount")), channelId: Number(fd.get("channelId")), status: 1,
        files: M.filesFromForm(fd, r.files),
      });
      r.statusHistory.push({ status: 1, changedAt: new Date().toISOString(), changedByName: M.agentName(r.agentId) });
      return true;
    },
  );

// ===================== Team Leader (role 2) =====================
export const useCfTeamSummary = (query: { from?: string; to?: string }) =>
  useCf<CfTeamSummary>(["team", "summary"], "/team/summary", () => {
    const regs = M.db.regs.filter((r) => M.inRange(r.createdAt, query.from, query.to));
    return { ...M.counts(regs), byAgent: M.byAgent(regs), byChannel: M.byChannel(regs) };
  }, query);

// ===================== Ops (role 11) =====================
export const useCfOpsDashboard = () =>
  useCf<CfOpsDashboard>(["ops", "dashboard"], "/ops/dashboard", () => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      pending: M.db.regs.filter((r) => r.status === 1).length,
      reviewedToday: M.db.history.filter((h) => h.reviewedAt.startsWith(today)).length,
      approvedByMe: M.db.history.filter((h) => h.decision === "approve").length,
      rejectedByMe: M.db.history.filter((h) => h.decision === "reject").length,
    };
  });

const queueMock = (q: Q) =>
  M.page(
    M.db.regs.filter((r) => r.status === 1).map((r): CfQueueItem => ({
      id: r.id, customerName: M.customerOf(r).customerName, nationalId: r.nationalId,
      agentName: M.agentName(r.agentId), channelName: M.channelName(r.channelId), submittedAt: r.createdAt,
    })),
    Number(q.page ?? 1),
  );
export const useCfOpsQueue = (query: { page?: number }) =>
  usePaged<CfQueueItem>(["ops", "queue"], "/ops/queue", queueMock, query);
/** Fetch first page of the queue on demand (used to jump to the next item). */
export const fetchCfOpsQueue = async (): Promise<CfQueueItem[]> =>
  CF_MOCK ? queueMock({ page: 1 }).items : toPaged(await api<Paged<CfQueueItem> | CfQueueItem[]>(`${BASE}/ops/queue`, { query: { page: 1 } })).items;

export const useCfOpsHistory = (query: { from?: string; to?: string; decision?: string; page?: number }) =>
  usePaged<CfHistoryItem>(["ops", "history"], "/ops/history", (q) =>
    M.page(
      M.db.history
        .filter((h) => M.inRange(h.reviewedAt, query.from, query.to))
        .filter((h) => !q.decision || h.decision === q.decision)
        .slice().reverse(),
      Number(q.page ?? 1),
    ), query);

export const useCfReasons = () => useCf<CfReason[]>(["ops", "reasons"], "/ops/reasons", () => M.MOCK_REASONS);

const regDetailMock = (id: number) => {
  const r = M.db.regs.find((x) => x.id === id);
  if (!r) throw new Error("Registration not found");
  return M.regDetail(r);
};
export const useCfOpsRegistration = (id: number, enabled = true) =>
  useCf<CfRegistrationDetail>(["ops", "registration", id], `/ops/registrations/${id}`, () => regDetailMock(id), undefined, enabled);

export const useCfClaim = () =>
  useMutation({
    mutationFn: (id: number) =>
      CF_MOCK ? (M.db.regs.find((r) => r.id === id)?.status === 1 ? wait(true) : fail("This registration is not pending review"))
        : api(`${BASE}/ops/registrations/${id}/claim`, { method: "POST" }),
  });

export const useCfDecision = (id: number) =>
  useCfMutation<{ decision: "approve" | "reject"; reasonIds: number[]; note?: string }>(
    (body) => api(`${BASE}/ops/registrations/${id}/decision`, { method: "POST", body }),
    (body) => {
      const r = M.db.regs.find((x) => x.id === id)!;
      const now = new Date().toISOString();
      const reasons = M.MOCK_REASONS.filter((x) => body.reasonIds.includes(x.id)).map((x) => x.nameAr);
      r.status = body.decision === "approve" ? 2 : 3;
      r.rounds.push({ roundNumber: r.rounds.length + 1, decision: body.decision, reasons, note: body.note, reviewedAt: now, reviewerName: "Mock Ops" });
      r.statusHistory.push({ status: r.status, changedAt: now, changedByName: "Mock Ops" });
      M.db.history.push({ id: 5000 + M.db.history.length + 100, registrationId: id, customerName: M.customerOf(r).customerName, nationalId: r.nationalId, decision: body.decision, reasons, reviewedAt: now });
      return true;
    },
  );

// ===================== Admin (role 10) =====================
export const useCfAdminDashboard = () =>
  useCf<CfAdminDashboard>(["admin", "dashboard"], "/admin/dashboard", () => {
    const trend = new Map<string, number>();
    M.db.regs.forEach((r) => trend.set(r.createdAt.slice(0, 10), (trend.get(r.createdAt.slice(0, 10)) ?? 0) + 1));
    const c = M.counts(M.db.regs);
    return {
      totalCustomersInList: M.db.customers.length, totalRegistrations: c.total, underReview: c.underReview,
      approved: c.approved, rejected: c.rejected, byAgent: M.byAgent(M.db.regs), byChannel: M.byChannel(M.db.regs),
      dailyTrend: [...trend.entries()].sort().map(([date, count]) => ({ date, count })),
    };
  });

export const useCfImportCustomers = () =>
  useCfMutation<File, CfImportSummary>(
    (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return api(`${BASE}/admin/import-customers`, { method: "POST", body: fd, isForm: true });
    },
    () => ({
      inserted: 42, updated: 5, skipped: 2, invalid: 3,
      issues: [
        { rowNum: 7, nationalId: "2950101010", reason: "National ID must be 14 digits" },
        { rowNum: 15, nationalId: "19901010101234", reason: "Invalid national ID" },
        { rowNum: 33, nationalId: M.mockNid(3), reason: "Missing approved limit" },
      ],
    }),
  );

export const useCfBatches = () => useCf<CfBatch[]>(["admin", "batches"], "/admin/batches", () => M.db.batches);

export type CfAdminRegQuery = { search?: string; status?: string; agentId?: string; channelId?: string; from?: string; to?: string; page?: number };
export const useCfAdminRegistrations = (query: CfAdminRegQuery) =>
  usePaged<CfAdminRegistrationRow>(["admin", "registrations"], "/admin/registrations", (q) =>
    M.page(
      M.db.regs
        .filter((r) => (!q.status || String(r.status) === q.status) && (!q.agentId || String(r.agentId) === q.agentId) && (!q.channelId || String(r.channelId) === q.channelId))
        .filter((r) => M.inRange(r.createdAt, query.from, query.to))
        .map((r) => ({
          id: r.id, customerName: M.customerOf(r).customerName, nationalId: r.nationalId, agentName: M.agentName(r.agentId),
          channelName: M.channelName(r.channelId), amount: r.amount, status: r.status, createdAt: r.createdAt,
        }))
        .filter((r) => textMatch(r.customerName + " " + r.nationalId, q))
        .reverse(),
      Number(q.page ?? 1),
    ), query);

export const useCfAdminRegistration = (id: number) =>
  useCf<CfRegistrationDetail>(["admin", "registration", id], `/admin/registrations/${id}`, () => regDetailMock(id));

export type CfCustomerQuery = { search?: string; hasContract?: string; batchId?: string; page?: number };
export const useCfAdminCustomers = (query: CfCustomerQuery) =>
  usePaged<CfCustomer>(["admin", "customers"], "/admin/customers", (q) =>
    M.page(
      M.db.customers
        .filter((c) => (!q.hasContract || String(c.hasContract) === q.hasContract) && (!q.batchId || String(c.batchId) === q.batchId))
        .filter((c) => textMatch(`${c.customerName} ${c.nationalId} ${c.contactNumber} ${c.company}`, q)),
      Number(q.page ?? 1),
    ), query);

/** Mock agents list for admin filters (real mode derives from dashboard byAgent). */
export const MOCK_CF_AGENTS = M.MOCK_AGENTS;

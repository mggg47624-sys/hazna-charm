// Consumer Finance API hooks — real .NET API only.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  CfAdminDashboard, CfAdminRegistrationRow, CfAgentRegistration, CfAgentRow, CfBatch,
  CfCheckResult, CfCounts, CfCustomer, CfHistoryItem, CfImportSummary,
  CfOpsDashboard, CfQueueItem, CfReason, CfRegistrationDetail, CfTeamSummary, Paged,
} from "./cf-types";

const BASE = "/api/consumer-finance";
type Q = Record<string, string | number | boolean | undefined | null>;

function toPaged<T>(d: Paged<T> | T[] | undefined, p = 1): Paged<T> {
  if (Array.isArray(d)) return { items: d, total: d.length, page: p, pageSize: d.length || 10 };
  return d ?? { items: [], total: 0, page: p, pageSize: 10 };
}
function useCf<T>(key: unknown[], path: string, query?: Q, enabled = true) {
  return useQuery({
    queryKey: ["cf", ...key, query ?? {}],
    queryFn: () => api<T>(`${BASE}${path}`, { query }),
    enabled,
  });
}
function usePaged<T>(key: unknown[], path: string, query: Q) {
  const r = useCf<Paged<T> | T[]>(key, path, query);
  return { ...r, data: r.data ? toPaged(r.data, Number(query.page ?? 1)) : undefined };
}
function useCfMutation<V, R = unknown>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: ["cf"] }) });
}

export const useCfAgentDashboard = () =>
  useCf<CfCounts>(["agent", "dashboard"], "/agent/dashboard");
export const useCfAgentRegistrations = (query: { search?: string; status?: string; page?: number }) =>
  usePaged<CfAgentRow>(["agent", "registrations"], "/agent/registrations", query);
export const useCfAgentRegistration = (id: number) =>
  useCf<CfAgentRegistration>(["agent", "registration", id], `/agent/registrations/${id}`);
export const useCfCheckNationalId = () =>
  useCfMutation<string, CfCheckResult>((nationalId) =>
    api(`${BASE}/agent/check-national-id`, { method: "POST", body: { nationalId } }));
export const useCfCreateRegistration = () =>
  useCfMutation<FormData>((fd) => api(`${BASE}/agent/registrations`, { method: "POST", body: fd, isForm: true }));
export const useCfUpdateRegistration = (id: number) =>
  useCfMutation<FormData>((fd) => api(`${BASE}/agent/registrations/${id}`, { method: "PUT", body: fd, isForm: true }));
export const useCfTeamSummary = (query: { from?: string; to?: string }) =>
  useCf<CfTeamSummary>(["team", "summary"], "/team/summary", query);

export const useCfOpsDashboard = () =>
  useCf<CfOpsDashboard>(["ops", "dashboard"], "/ops/dashboard");
export const useCfOpsQueue = (query: { page?: number }) =>
  usePaged<CfQueueItem>(["ops", "queue"], "/ops/queue", query);
/** Fetch first page on demand to jump to the next queue item. */
export const fetchCfOpsQueue = async (): Promise<CfQueueItem[]> =>
  toPaged(await api<Paged<CfQueueItem> | CfQueueItem[]>(`${BASE}/ops/queue`, { query: { page: 1 } })).items;
export const useCfOpsHistory = (query: { from?: string; to?: string; decision?: string; page?: number }) =>
  usePaged<CfHistoryItem>(["ops", "history"], "/ops/history", query);
export const useCfReasons = () => useCf<CfReason[]>(["ops", "reasons"], "/ops/reasons");
export const useCfOpsRegistration = (id: number, enabled = true) =>
  useCf<CfRegistrationDetail>(["ops", "registration", id], `/ops/registrations/${id}`, undefined, enabled);
export const useCfClaim = () => useMutation({
  mutationFn: (id: number) => api(`${BASE}/ops/registrations/${id}/claim`, { method: "POST" }),
});
export const useCfDecision = (id: number) =>
  useCfMutation<{ decision: "approve" | "reject"; reasonIds: number[]; note?: string }>((body) =>
    api(`${BASE}/ops/registrations/${id}/decision`, { method: "POST", body }));

export const useCfAdminDashboard = () =>
  useCf<CfAdminDashboard>(["admin", "dashboard"], "/admin/dashboard");
export const useCfImportCustomers = () => useCfMutation<File, CfImportSummary>((file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api(`${BASE}/admin/import-customers`, { method: "POST", body: fd, isForm: true });
});
export const useCfBatches = () => useCf<CfBatch[]>(["admin", "batches"], "/admin/batches");
export type CfAdminRegQuery = { search?: string; status?: string; agentId?: string; channelId?: string; from?: string; to?: string; page?: number };
export const useCfAdminRegistrations = (query: CfAdminRegQuery) =>
  usePaged<CfAdminRegistrationRow>(["admin", "registrations"], "/admin/registrations", query);
export const useCfAdminRegistration = (id: number) =>
  useCf<CfRegistrationDetail>(["admin", "registration", id], `/admin/registrations/${id}`);
export type CfCustomerQuery = { search?: string; hasContract?: string; batchId?: string; page?: number };
export const useCfAdminCustomers = (query: CfCustomerQuery) =>
  usePaged<CfCustomer>(["admin", "customers"], "/admin/customers", query);

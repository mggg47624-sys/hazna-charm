/**
 * TeleSales domain hooks. All calls proxy through `api()` so mock/router.ts
 * intercepts them in dev.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getToken } from "./api";
import type {
  Campaign,
  TSBatch,
  TSCallRecord,
  TSForm,
  TSLead,
  TSNextLead,
  Warning,
  AuditLogEntry,
  Referral,
} from "./types";

const enabled = () => !!getToken();

// ---------- Campaigns ----------
export function useCampaigns() {
  return useQuery({
    queryKey: ["ts", "campaigns"],
    queryFn: () => api<Campaign[]>("/api/ts/Campaign"),
    enabled: enabled(),
  });
}
export function useCampaign(id: number | undefined) {
  return useQuery({
    queryKey: ["ts", "campaign", id],
    queryFn: () => api<Campaign>(`/api/ts/Campaign/${id}`),
    enabled: enabled() && !!id,
  });
}
export function useActiveCampaigns() {
  return useQuery({
    queryKey: ["ts", "campaigns", "available"],
    queryFn: () => api<Campaign[]>("/api/ts/Campaign/Availability"),
    enabled: enabled(),
  });
}
export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Campaign>) =>
      api<Campaign>("/api/ts/Campaign", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "campaigns"] }),
  });
}
export function useToggleCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api(`/api/ts/Campaign/ToggleActive/${id}`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "campaigns"] }),
  });
}

// ---------- Forms ----------
export function useCampaignForm(campaignId: number | undefined) {
  return useQuery({
    queryKey: ["ts", "form", "campaign", campaignId],
    queryFn: () => api<TSForm | null>(`/api/ts/Form/ByCampaign/${campaignId}`),
    enabled: enabled() && !!campaignId,
  });
}

// ---------- Batches ----------
export function useBatches() {
  return useQuery({
    queryKey: ["ts", "batches"],
    queryFn: () => api<TSBatch[]>("/api/ts/Batch"),
    enabled: enabled(),
  });
}
export function useBatchesByCampaign(campaignId: number | undefined) {
  return useQuery({
    queryKey: ["ts", "batches", "campaign", campaignId],
    queryFn: () => api<TSBatch[]>(`/api/ts/Batch/ByCampaign/${campaignId}`),
    enabled: enabled() && !!campaignId,
  });
}
export function useBatch(id: number | undefined) {
  return useQuery({
    queryKey: ["ts", "batch", id],
    queryFn: () => api<TSBatch & { leads: TSLead[] }>(`/api/ts/Batch/GetById/${id}`),
    enabled: enabled() && !!id,
  });
}
export function useUploadBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { campaignId: number; name: string; leads?: any[] }) =>
      api<TSBatch>("/api/ts/Batch", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "batches"] }),
  });
}

// ---------- Queue ----------
export function useTsNextLead() {
  return useMutation({
    mutationFn: (campaignId?: number) =>
      api<TSNextLead>("/api/ts/Queue/NextLead", {
        query: campaignId ? { campaignId } : undefined,
      }),
  });
}
export function useTsCallLater() {
  return useQuery({
    queryKey: ["ts", "callLater"],
    queryFn: () => api<Array<TSLead & { scheduledAt?: string }>>("/api/ts/Queue/CallLater"),
    enabled: enabled(),
  });
}
export function useTsSubmitCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      leadId: number;
      campaignId: number;
      callResultId: number;
      answersJson?: string | null;
      notes?: string;
    }) => api<{ status: string; callId: number }>("/api/ts/Queue/Submit", { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ts"] });
    },
  });
}
export function useAddReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Referral) =>
      api("/api/ts/Queue/addReferral", { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ts", "leads"] });
      qc.invalidateQueries({ queryKey: ["ts", "batches"] });
    },
  });
}

// ---------- Reports ----------
export function useTsReportCalls(campaignId: number | undefined) {
  return useQuery({
    queryKey: ["ts", "report", "calls", campaignId],
    queryFn: () => api<TSCallRecord[]>(`/api/ts/Report/Calls/${campaignId}`),
    enabled: enabled() && !!campaignId,
  });
}
export function useTsReportAgents(campaignId: number | undefined) {
  return useQuery({
    queryKey: ["ts", "report", "agents", campaignId],
    queryFn: () => api<any[]>(`/api/ts/Report/AgentStats/${campaignId}`),
    enabled: enabled() && !!campaignId,
  });
}
export function useTsReportLeads(campaignId: number | undefined) {
  return useQuery({
    queryKey: ["ts", "report", "leads", campaignId],
    queryFn: () => api<any[]>(`/api/ts/Report/Leads/${campaignId}`),
    enabled: enabled() && !!campaignId,
  });
}

// ---------- Agent Report (per-agent stats) ----------
export function useTsAgentToday() {
  return useQuery({
    queryKey: ["ts", "agent", "today"],
    queryFn: () => api<any>("/api/ts/AgentReport/Today"),
    enabled: enabled(),
  });
}

// ---------- Warnings ----------
export function useWarnings() {
  return useQuery({
    queryKey: ["ts", "warnings"],
    queryFn: () => api<Warning[]>("/api/ts/Warning/GetAll"),
    enabled: enabled(),
  });
}
export function useMyWarnings() {
  return useQuery({
    queryKey: ["ts", "warnings", "mine"],
    queryFn: () => api<Warning[]>("/api/ts/Warning/MyWarning"),
    enabled: enabled(),
  });
}
export function useGenerateWarning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { targetUserId: number; reason: string; severity: string }) =>
      api<Warning>("/api/ts/Warning/Generate", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "warnings"] }),
  });
}
export function useReplyWarning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      api(`/api/ts/Warning/Reply/${id}`, { method: "POST", body: { reply } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "warnings"] }),
  });
}
export function useActWarning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api(`/api/ts/Warning/Action/${id}`, { method: "POST", body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "warnings"] }),
  });
}

// ---------- Audit Log ----------
export function useAuditLog() {
  return useQuery({
    queryKey: ["ts", "audit"],
    queryFn: () => api<AuditLogEntry[]>("/api/ts/AuditLog"),
    enabled: enabled(),
  });
}

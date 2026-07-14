/**
 * TeleSales domain hooks — aligned with the Khazna backend contract.
 * Envelope handling lives in `api()`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getToken } from "./api";
import type {
  AuditLogEntry,
  Campaign,
  Referral,
  TSAgentDaily,
  TSBatch,
  TSBatchUploadResult,
  TSCallRecord,
  TSForm,
  TSFormOption,
  TSFormQuestion,
  TSNextLead,
  TSCallLaterItem,
  TSQuestionType,
  Warning,
} from "./types";

const enabled = () => !!getToken();

// ===================== Campaigns =====================
export function useCampaigns() {
  return useQuery({
    queryKey: ["ts", "campaigns"],
    queryFn: () => api<Campaign[]>("/api/ts/Campaign"),
    enabled: enabled(),
  });
}
export function useActiveCampaigns() {
  // Backend uses same list; caller filters by isActive if needed.
  return useCampaigns();
}
export function useCampaign(id: number | undefined) {
  return useQuery({
    queryKey: ["ts", "campaign", id],
    queryFn: () => api<Campaign>(`/api/ts/Campaign/${id}`),
    enabled: enabled() && !!id,
  });
}
export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; agentIds: number[] }) =>
      api<Campaign>("/api/ts/Campaign", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "campaigns"] }),
  });
}
export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number; name: string; description?: string }) =>
      api<Campaign>(`/api/ts/Campaign/${id}`, { method: "PUT", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "campaigns"] }),
  });
}
export function useToggleCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api(`/api/ts/Campaign/${id}/ToggleActive`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "campaigns"] }),
  });
}
export function useAddCampaignAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, agentId }: { campaignId: number; agentId: number }) =>
      api(`/api/ts/Campaign/${campaignId}/Agents`, { method: "POST", body: { agentId } }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["ts", "campaign", v.campaignId] }),
  });
}
export function useToggleCampaignAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, agentId }: { campaignId: number; agentId: number }) =>
      api(`/api/ts/Campaign/${campaignId}/Agents/Toggle`, {
        method: "PATCH",
        body: { agentId },
      }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["ts", "campaign", v.campaignId] }),
  });
}

// Campaign Call Results (which lead pool)
export function useCampaignCallResults(campaignId: number | undefined) {
  return useQuery({
    queryKey: ["ts", "campaign", campaignId, "callResults"],
    queryFn: () => api<Array<{ id: number; name: string }>>(
      `/api/ts/Campaign/${campaignId}/CallResults`,
    ),
    enabled: enabled() && !!campaignId,
  });
}
export function useSetCampaignCallResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, callResultIds }: { campaignId: number; callResultIds: number[] }) =>
      api(`/api/ts/Campaign/${campaignId}/CallResults`, {
        method: "POST",
        body: { callResultIds },
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["ts", "campaign", v.campaignId, "callResults"] }),
  });
}

// ===================== Batches =====================
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
    queryFn: () => api<TSBatch>(`/api/ts/Batch/${id}`),
    enabled: enabled() && !!id,
  });
}
// Legacy alias so existing screens keep compiling
export function useBatches() {
  // No global list endpoint — return empty gracefully if not scoped.
  return useQuery({
    queryKey: ["ts", "batches", "all"],
    queryFn: async () => [] as TSBatch[],
    enabled: false,
  });
}

export function useUploadBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      campaignId,
      file,
      followUpDays,
      agents,
    }: {
      campaignId: number;
      file: File;
      followUpDays?: number;
      agents: Array<{ agentId: number; maxCalls: number }>;
    }) => {
      const fd = new FormData();
      fd.append("campaignId", String(campaignId));
      if (followUpDays != null) fd.append("followUpDays", String(followUpDays));
      fd.append("agents", JSON.stringify(agents));
      fd.append("file", file);
      return api<TSBatchUploadResult>("/api/ts/Batch", {
        method: "POST",
        body: fd,
        isForm: true,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "batches"] }),
  });
}
export function useConfirmDuplicates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      batchId: number;
      leads: Array<{
        phone: string;
        fullName: string;
        company?: string;
        registrationDate?: string | null;
        activationDate?: string | null;
      }>;
    }) => api("/api/ts/Batch/ConfirmDuplicates", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "batches"] }),
  });
}
export function useUpdateBatchAgentMax() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      batchId,
      agentId,
      maxCalls,
    }: {
      batchId: number;
      agentId: number;
      maxCalls: number;
    }) =>
      api(`/api/ts/Batch/${batchId}/Agents/${agentId}`, {
        method: "PATCH",
        body: maxCalls,
      }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["ts", "batch", v.batchId] }),
  });
}

// ===================== Leads =====================
export function useToggleBatchAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, isAvailable }: { batchId: number; isAvailable: boolean }) =>
      api("/api/ts/Leads/Availability", {
        method: "PATCH",
        body: { batchId, isAvailable },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "batches"] }),
  });
}
export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: number;
      fullName: string;
      phone: string;
      company?: string;
    }) => api(`/api/ts/Leads/${id}`, { method: "PUT", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts"] }),
  });
}
export function useAddManualLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      campaignId: number;
      fullName: string;
      phone: string;
      company?: string;
    }) =>
      api<{ leadId: number; callAttemptId: number; batchId: number }>(
        "/api/ts/Leads/Manual",
        { method: "POST", body },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts"] }),
  });
}
// Legacy alias
export const useAddReferral = () => {
  const m = useAddManualLead();
  return {
    ...m,
    mutate: (body: Referral, opts?: any) => {
      // Manual leads need a campaignId — legacy referral form doesn't supply one.
      // Callers using this path must pass campaignId in body via companyName hack? — leave to caller.
      const b = body as any;
      m.mutate(
        {
          campaignId: Number(b.campaignId ?? 0),
          fullName: b.fullName ?? b.customerName ?? "",
          phone: b.phone,
          company: b.company ?? b.companyName,
        },
        opts,
      );
    },
  };
};

// ===================== Forms =====================
export function useFormsByCampaign(campaignId: number | undefined) {
  return useQuery({
    queryKey: ["ts", "forms", "campaign", campaignId],
    queryFn: () => api<TSForm[]>(`/api/ts/Form/ByCampaign/${campaignId}`),
    enabled: enabled() && !!campaignId,
  });
}
export function useForm(id: number | undefined) {
  return useQuery({
    queryKey: ["ts", "form", id],
    queryFn: () => api<TSForm>(`/api/ts/Form/${id}`),
    enabled: enabled() && !!id,
  });
}
// Legacy compat (was root form for a campaign)
export function useCampaignForm(campaignId: number | undefined) {
  return useFormsByCampaign(campaignId);
}

export function fetchForm(id: number) {
  return api<TSForm>(`/api/ts/Form/${id}`);
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { campaignId: number; name: string; isRoot: boolean }) =>
      api<TSForm>("/api/ts/Form", { method: "POST", body }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["ts", "forms", "campaign", v.campaignId] }),
  });
}
export function useUpdateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      api(`/api/ts/Form/${id}`, { method: "PUT", body: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "forms"] }),
  });
}
export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      formId: number;
      questionText: string;
      questionType: TSQuestionType;
      nextFormId?: number | null;
      displayOrder?: number;
    }) => api<TSFormQuestion>("/api/ts/Form/Questions", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "form"] }),
  });
}
export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: number;
      questionText: string;
      questionType: TSQuestionType;
      nextFormId?: number | null;
      displayOrder?: number;
    }) => api(`/api/ts/Form/Questions/${id}`, { method: "PUT", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "form"] }),
  });
}
export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/api/ts/Form/Questions/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "form"] }),
  });
}
export function useCreateOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      questionId: number;
      optionText: string;
      nextFormId?: number | null;
      displayOrder?: number;
    }) => api<TSFormOption>("/api/ts/Form/Options", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "form"] }),
  });
}
export function useUpdateOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: number;
      optionText: string;
      nextFormId?: number | null;
      displayOrder?: number;
    }) => api(`/api/ts/Form/Options/${id}`, { method: "PUT", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "form"] }),
  });
}
export function useDeleteOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api(`/api/ts/Form/Options/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "form"] }),
  });
}

// ===================== Queue =====================
export function useTsNextLead() {
  return useMutation({
    mutationFn: () => api<TSNextLead>("/api/ts/Queue/NextLead"),
  });
}
export function useTsCallLater() {
  return useQuery({
    queryKey: ["ts", "callLater"],
    queryFn: () => api<TSCallLaterItem[]>("/api/ts/Queue/CallLater"),
    enabled: enabled(),
  });
}
export function useTsPickCallLater() {
  return useMutation({
    mutationFn: (leadId: number) =>
      api<TSNextLead>(`/api/ts/Queue/PickFromCallLater/${leadId}`, { method: "POST" }),
  });
}
export function useTsSubmitCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      callAttemptId: number;
      callResultId: number;
      answersJson?: string | null;
      notes?: string;
    }) =>
      api<{ status: string; callAttemptId: number }>("/api/ts/Queue/Submit", {
        method: "POST",
        body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts"] }),
  });
}

// ===================== Validation & Activation =====================
export function useUploadValidation() {
  return useMutation({
    mutationFn: ({ campaignId, file }: { campaignId: number; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      return api<{ matchedLeads: number; unmatchedLeads: number }>(
        `/api/ts/Validation/${campaignId}`,
        { method: "POST", body: fd, isForm: true },
      );
    },
  });
}
export function useUploadActivation() {
  return useMutation({
    mutationFn: ({ campaignId, file }: { campaignId: number; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      return api<{ matchedLeads: number; unmatchedLeads: number }>(
        `/api/ts/Activation/${campaignId}`,
        { method: "POST", body: fd, isForm: true },
      );
    },
  });
}

// ===================== Warnings & Targets =====================
export function useMyWarnings(status?: number) {
  return useQuery({
    queryKey: ["ts", "warnings", "mine", status ?? "all"],
    queryFn: () =>
      api<Warning[]>("/api/ts/Warning/My", {
        query: status ? { status } : undefined,
      }),
    enabled: enabled(),
  });
}
export function useWarnings(status?: number) {
  return useQuery({
    queryKey: ["ts", "warnings", status ?? "all"],
    queryFn: () =>
      api<Warning[]>("/api/ts/Warning", {
        query: status ? { status } : undefined,
      }),
    enabled: enabled(),
  });
}
export function useReplyWarning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      api(`/api/ts/Warning/${id}/Reply`, { method: "PATCH", body: { note } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "warnings"] }),
  });
}
export function useActWarning() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      adminAction,
      adminNote,
    }: {
      id: number;
      adminAction: 1 | 2;
      adminNote?: string;
    }) =>
      api(`/api/ts/Warning/${id}/Action`, {
        method: "PATCH",
        body: { adminAction, adminNote },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "warnings"] }),
  });
}
export function useGenerateWarnings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) =>
      api<number>("/api/ts/Warning/Generate", {
        method: "POST",
        query: { date },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ts", "warnings"] }),
  });
}
// Legacy alias
export const useGenerateWarning = useGenerateWarnings;

export function useSetAgentTarget() {
  return useMutation({
    mutationFn: (body: { campaignId: number; agentId: number; minCalls: number }) =>
      api("/api/ts/Warning/Target", { method: "POST", body }),
  });
}

// ===================== Agent Daily Report =====================
export function useTsAgentToday() {
  return useQuery({
    queryKey: ["ts", "agent", "today"],
    queryFn: () => api<TSAgentDaily>("/api/ts/AgentReport/Today"),
    enabled: enabled(),
  });
}
export function useTsAgentByDate(date: string | undefined) {
  return useQuery({
    queryKey: ["ts", "agent", "date", date],
    queryFn: () => api<TSAgentDaily>("/api/ts/AgentReport/Date", { query: { date } }),
    enabled: enabled() && !!date,
  });
}
export function useTsAgentReport(agentId: number | undefined, date?: string) {
  return useQuery({
    queryKey: ["ts", "agent", agentId, date],
    queryFn: () =>
      api<TSAgentDaily>(`/api/ts/AgentReport/${agentId}`, {
        query: date ? { date } : undefined,
      }),
    enabled: enabled() && !!agentId,
  });
}

// ===================== Reports =====================
export function useTsReportLeads(campaignId: number | undefined) {
  return useQuery({
    queryKey: ["ts", "report", "leads", campaignId],
    queryFn: () => api<any[]>(`/api/ts/Report/Leads/${campaignId}`),
    enabled: enabled() && !!campaignId,
  });
}
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

// ===================== Audit Log =====================
export function useAuditLog(filters?: { tableName?: string; userId?: number }) {
  return useQuery({
    queryKey: ["ts", "audit", filters?.tableName ?? "", filters?.userId ?? ""],
    queryFn: () =>
      api<AuditLogEntry[]>("/api/ts/AuditLog", {
        query: {
          tableName: filters?.tableName || undefined,
          userId: filters?.userId || undefined,
        },
      }),
    enabled: enabled(),
  });
}

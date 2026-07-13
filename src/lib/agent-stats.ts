import { useQuery } from "@tanstack/react-query";
import { api, getToken } from "@/lib/api";

/**
 * Agent statistics — backed by /api/AgentStats. AgentId is derived from the
 * JWT server-side, so no agentId is sent from the client.
 */

export interface AgentStatsSummary {
  totalCalls: number;
  answeredCalls: number;
  unansweredCalls: number;
  wrongNumberCalls: number;
  callLaterCalls: number;
  completedEvaluations: number;
  firstCallTime: string | null;
  lastCallTime: string | null;
  avgLeadDurationMinutes: number | null;
  totalWorkingMinutes: number | null;
}

export interface AgentDailyCall {
  callId: number;
  khaznaId: string;
  customerName: string;
  callResult: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  totalScore: number | null;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const enabledOpts = () => ({ enabled: !!getToken(), staleTime: 30_000 });

export function useAgentStatsToday() {
  return useQuery({
    queryKey: ["agent-stats", "today", todayStr()],
    queryFn: () => api<AgentStatsSummary>("/api/AgentStats/Today"),
    ...enabledOpts(),
  });
}

export function useAgentStatsMonth() {
  return useQuery({
    queryKey: ["agent-stats", "month", todayStr().slice(0, 7)],
    queryFn: () => api<AgentStatsSummary>("/api/AgentStats/Month"),
    ...enabledOpts(),
  });
}

export function useAgentStatsRange(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["agent-stats", "range", dateFrom, dateTo],
    queryFn: () =>
      api<AgentStatsSummary>("/api/AgentStats/Range", {
        query: { dateFrom, dateTo },
      }),
    enabled: !!getToken() && !!dateFrom && !!dateTo,
    staleTime: 30_000,
  });
}

export function useAgentStatsDaily(date: string) {
  return useQuery({
    queryKey: ["agent-stats", "daily", date],
    queryFn: () =>
      api<AgentDailyCall[]>("/api/AgentStats/Daily", { query: { date } }),
    enabled: !!getToken() && !!date,
    staleTime: 30_000,
  });
}

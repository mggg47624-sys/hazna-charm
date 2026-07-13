import { useQuery, useQueries } from "@tanstack/react-query";
import { api, getToken } from "./api";
import type { Lookup } from "./types";

/**
 * The backend exposes SEPARATE lookup endpoints — one per list — each
 * returning an array of `{ id, name }`. Endpoint paths per swagger contain
 * literal spaces (URL-encoded here).
 */

function normalizeList(v: unknown): Lookup[] {
  const arr = Array.isArray(v)
    ? v
    : Array.isArray((v as any)?.data)
      ? (v as any).data
      : Array.isArray((v as any)?.$values)
        ? (v as any).$values
        : [];
  return arr
    .map((row: any) => {
      if (!row || typeof row !== "object") return null;
      const id = row.id ?? row.Id ?? row.ID ?? row.value;
      const name = row.name ?? row.Name ?? row.label ?? row.text ?? row.fullName ?? "";
      const nameEn = row.nameEn ?? row.NameEn ?? row.nameEN ?? undefined;
      if (id === undefined || id === null) return null;
      return { id: Number(id), name: String(name), nameEn } as Lookup;
    })
    .filter(Boolean) as Lookup[];
}

function makeLookupHook(path: string, key: string) {
  return () =>
    useQuery({
      queryKey: ["lookup", key],
      queryFn: async () => normalizeList(await api<any>(path)),
      enabled: !!getToken(),
      staleTime: Infinity,
      gcTime: Infinity,
      retry: 1,
    });
}

export const useRoles = makeLookupHook("/api/Lookup/Get%20Roles", "roles");
export const useCallResults = makeLookupHook("/api/Lookup/Call%20Results", "callResults");
export const useTransactionTypes = makeLookupHook("/api/Lookup/Transaction%20Types", "transactionTypes");
export const useCustomerStatuses = makeLookupHook("/api/Lookup/Customer%20Statuses", "customerStatuses");
export const useQaTeamLeaders = makeLookupHook("/api/Lookup/QA%20Team%20Leaders", "qaTeamLeaders");
export const useTsTeamLeaders = makeLookupHook("/api/Lookup/TS%20Team%20Leaders", "tsTeamLeaders");
/** @deprecated use `useQaTeamLeaders` — kept for existing call sites. */
export const useTeamLeaders = useQaTeamLeaders;

export interface AllLookups {
  roles: Lookup[];
  callResults: Lookup[];
  transactionTypes: Lookup[];
  customerStatuses: Lookup[];
  qaTeamLeaders: Lookup[];
  tsTeamLeaders: Lookup[];
}

export function useLookups() {
  const enabled = !!getToken();
  const queries = useQueries({
    queries: [
      { queryKey: ["lookup", "roles"], queryFn: async () => normalizeList(await api<any>("/api/Lookup/Get%20Roles")), enabled, staleTime: Infinity, gcTime: Infinity },
      { queryKey: ["lookup", "callResults"], queryFn: async () => normalizeList(await api<any>("/api/Lookup/Call%20Results")), enabled, staleTime: Infinity, gcTime: Infinity },
      { queryKey: ["lookup", "transactionTypes"], queryFn: async () => normalizeList(await api<any>("/api/Lookup/Transaction%20Types")), enabled, staleTime: Infinity, gcTime: Infinity },
      { queryKey: ["lookup", "customerStatuses"], queryFn: async () => normalizeList(await api<any>("/api/Lookup/Customer%20Statuses")), enabled, staleTime: Infinity, gcTime: Infinity },
      { queryKey: ["lookup", "qaTeamLeaders"], queryFn: async () => normalizeList(await api<any>("/api/Lookup/QA%20Team%20Leaders")), enabled, staleTime: Infinity, gcTime: Infinity },
      { queryKey: ["lookup", "tsTeamLeaders"], queryFn: async () => normalizeList(await api<any>("/api/Lookup/TS%20Team%20Leaders")), enabled, staleTime: Infinity, gcTime: Infinity },
    ],
  });
  const [roles, callResults, transactionTypes, customerStatuses, qaTeamLeaders, tsTeamLeaders] = queries;
  return {
    data: {
      roles: roles.data ?? [],
      callResults: callResults.data ?? [],
      transactionTypes: transactionTypes.data ?? [],
      customerStatuses: customerStatuses.data ?? [],
      qaTeamLeaders: qaTeamLeaders.data ?? [],
      tsTeamLeaders: tsTeamLeaders.data ?? [],
    } as AllLookups,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}

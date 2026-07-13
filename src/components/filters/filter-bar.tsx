import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Phone, RotateCcw } from "lucide-react";
import {
  useCallResults,
  useCustomerStatuses,
  useTransactionTypes,
} from "@/lib/lookups";
import { useCampaigns } from "@/lib/ts-api";

/**
 * Composable filter bar — reusable across report / list pages.
 * Pass `fields` to opt into any subset. State is stored in the parent
 * (via `values` + `onChange`) so pages own persistence / URL sync.
 */

export type FilterKey =
  | "search"
  | "mobile"
  | "dateFrom"
  | "dateTo"
  | "agent"
  | "agentId"
  | "campaignId"
  | "team"
  | "batchId"
  | "salesRep"
  | "customerStatus"
  | "callResult"
  | "operationType"
  | "warningStatus";

export type FilterValues = Partial<Record<FilterKey, string>>;

export interface Option {
  value: string;
  label: string;
}

interface Props {
  fields: FilterKey[];
  values: FilterValues;
  onChange: (next: FilterValues) => void;
  /** Custom options for `agent`, `salesRep`, `team`, `batchId`, `warningStatus`. */
  options?: Partial<Record<FilterKey, Option[]>>;
}

const setter =
  (values: FilterValues, onChange: Props["onChange"]) =>
  (key: FilterKey, v: string) =>
    onChange({ ...values, [key]: v });

export function FilterBar({ fields, values, onChange, options = {} }: Props) {
  const set = setter(values, onChange);
  const callResults = useCallResults();
  const customerStatuses = useCustomerStatuses();
  const txTypes = useTransactionTypes();
  const campaigns = useCampaigns();

  const has = (k: FilterKey) => fields.includes(k);

  const canReset = useMemo(
    () => fields.some((k) => (values[k] ?? "") !== ""),
    [fields, values],
  );

  const reset = () => {
    const cleared: FilterValues = {};
    fields.forEach((k) => (cleared[k] = ""));
    onChange(cleared);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {has("search") && (
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={values.search ?? ""}
            onChange={(e) => set("search", e.target.value)}
            className="pl-8"
          />
        </div>
      )}
      {has("mobile") && (
        <div className="relative w-[180px]">
          <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mobile number"
            value={values.mobile ?? ""}
            onChange={(e) => set("mobile", e.target.value)}
            className="pl-8"
          />
        </div>
      )}
      {has("dateFrom") && (
        <Input
          type="date"
          value={values.dateFrom ?? ""}
          onChange={(e) => set("dateFrom", e.target.value)}
          className="w-[150px]"
          aria-label="Date from"
        />
      )}
      {has("dateTo") && (
        <Input
          type="date"
          value={values.dateTo ?? ""}
          onChange={(e) => set("dateTo", e.target.value)}
          className="w-[150px]"
          aria-label="Date to"
        />
      )}
      {has("campaignId") && (
        <SelectFilter
          value={values.campaignId ?? ""}
          onValueChange={(v) => set("campaignId", v)}
          placeholder="Campaign"
          all="All campaigns"
          options={
            options.campaignId ??
            (campaigns.data ?? []).map((c) => ({
              value: String(c.id),
              label: c.name,
            }))
          }
        />
      )}
      {has("agent") && (
        <SelectFilter
          value={values.agent ?? ""}
          onValueChange={(v) => set("agent", v)}
          placeholder="Agent"
          all="All agents"
          options={options.agent ?? []}
        />
      )}
      {has("agentId") && (
        <SelectFilter
          value={values.agentId ?? ""}
          onValueChange={(v) => set("agentId", v)}
          placeholder="Agent"
          all="All agents"
          options={options.agentId ?? []}
        />
      )}
      {has("team") && (
        <SelectFilter
          value={values.team ?? ""}
          onValueChange={(v) => set("team", v)}
          placeholder="Team"
          all="All teams"
          options={options.team ?? []}
        />
      )}
      {has("batchId") && (
        <SelectFilter
          value={values.batchId ?? ""}
          onValueChange={(v) => set("batchId", v)}
          placeholder="Batch"
          all="All batches"
          options={options.batchId ?? []}
        />
      )}
      {has("salesRep") && (
        <SelectFilter
          value={values.salesRep ?? ""}
          onValueChange={(v) => set("salesRep", v)}
          placeholder="Sales Rep"
          all="All reps"
          options={options.salesRep ?? []}
        />
      )}
      {has("customerStatus") && (
        <SelectFilter
          value={values.customerStatus ?? ""}
          onValueChange={(v) => set("customerStatus", v)}
          placeholder="Status"
          all="All statuses"
          options={(customerStatuses.data ?? []).map((s) => ({
            value: s.name,
            label: s.nameEn || s.name,
          }))}
        />
      )}
      {has("callResult") && (
        <SelectFilter
          value={values.callResult ?? ""}
          onValueChange={(v) => set("callResult", v)}
          placeholder="Result"
          all="All results"
          options={(callResults.data ?? []).map((r) => ({
            value: r.name,
            label: r.nameEn || r.name,
          }))}
        />
      )}
      {has("operationType") && (
        <SelectFilter
          value={values.operationType ?? ""}
          onValueChange={(v) => set("operationType", v)}
          placeholder="Operation"
          all="All operations"
          options={(txTypes.data ?? []).map((t) => ({
            value: t.name,
            label: t.nameEn || t.name,
          }))}
        />
      )}
      {has("warningStatus") && (
        <SelectFilter
          value={values.warningStatus ?? ""}
          onValueChange={(v) => set("warningStatus", v)}
          placeholder="Warning status"
          all="All statuses"
          options={
            options.warningStatus ?? [
              { value: "open", label: "Open" },
              { value: "acknowledged", label: "Acknowledged" },
              { value: "resolved", label: "Resolved" },
              { value: "replied", label: "Replied" },
            ]
          }
        />
      )}
      {canReset && (
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>
      )}
    </div>
  );
}

function SelectFilter({
  value,
  onValueChange,
  placeholder,
  all,
  options,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  all: string;
  options: Option[];
}) {
  return (
    <Select
      value={value || "__all"}
      onValueChange={(v) => onValueChange(v === "__all" ? "" : v)}
    >
      <SelectTrigger className="w-[170px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{all}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Build a row-filter predicate from a FilterValues object.
 * Consumers pass field-accessor functions for the row shape.
 */
export function buildRowFilter<T>(
  values: FilterValues,
  accessors: Partial<Record<FilterKey, (row: T) => unknown>>,
  searchKeys?: Array<(row: T) => unknown>,
): (row: T) => boolean {
  const norm = (v: unknown) =>
    v == null ? "" : String(v).toLowerCase();
  const q = (values.search ?? "").toLowerCase().trim();
  const mobile = (values.mobile ?? "").replace(/\D/g, "");
  const dateFrom = values.dateFrom ?? "";
  const dateTo = values.dateTo ?? "";

  return (row: T) => {
    // Text search across provided keys
    if (q && searchKeys?.length) {
      const hit = searchKeys.some((fn) => norm(fn(row)).includes(q));
      if (!hit) return false;
    }
    // Mobile number match (digits-only)
    if (mobile) {
      const phone = String(accessors.mobile?.(row) ?? "").replace(/\D/g, "");
      if (!phone.includes(mobile)) return false;
    }
    // Date range (accessor returns ISO / YYYY-MM-DD string)
    if (dateFrom || dateTo) {
      const raw = String(accessors.dateFrom?.(row) ?? accessors.dateTo?.(row) ?? "");
      const d = raw.slice(0, 10);
      if (d) {
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }
    }
    // Equality-style filters
    for (const k of [
      "agent",
      "agentId",
      "campaignId",
      "team",
      "batchId",
      "salesRep",
      "customerStatus",
      "callResult",
      "operationType",
      "warningStatus",
    ] as const) {
      const v = values[k];
      if (!v) continue;
      const rowVal = accessors[k]?.(row);
      if (rowVal == null) return false;
      if (String(rowVal) !== v) return false;
    }
    return true;
  };
}

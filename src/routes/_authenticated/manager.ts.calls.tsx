import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SectionGuard } from "@/components/section-guard";
import { ReportTable } from "@/components/report-table";
import {
  FilterBar,
  buildRowFilter,
  type FilterValues,
} from "@/components/filters/filter-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveCampaigns } from "@/lib/ts-api";

export const Route = createFileRoute("/_authenticated/manager/ts/calls")({
  component: () => (
    <SectionGuard section="manager:ts">
      <Page />
    </SectionGuard>
  ),
});

function Page() {
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid;
  const [values, setValues] = useState<FilterValues>({});
  const predicate = useMemo(
    () =>
      buildRowFilter<any>(
        values,
        {
          dateFrom: (r) => r.callDate,
          dateTo: (r) => r.callDate,
          mobile: (r) => r.phone,
          callResult: (r) => r.callResult,
          agent: (r) => r.agentName,
        },
        [(r: any) => r.customerName, (r: any) => r.phone, (r: any) => r.agentName],
      ),
    [values],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">TS Calls</h1>
          <p className="text-sm text-muted-foreground">
            All calls for the selected campaign (read-only).
          </p>
        </div>
        <CampaignSelector value={activeCid} onChange={setCid} activeOnly />
      </div>

      {activeCid ? (
        <ReportTable
          queryKey={["manager", "ts", "calls", activeCid]}
          endpoint={`/api/ts/Report/Calls/${activeCid}`}
          filename={`ts-calls-campaign-${activeCid}`}
          searchPlaceholder="Search calls..."
          clientFilter={predicate}
          extraFilters={
            <FilterBar
              fields={["search", "mobile", "dateFrom", "dateTo", "callResult"]}
              values={values}
              onChange={setValues}
            />
          }
          columns={[
            { key: "callDate", header: "Date", accessor: (r: any) => new Date(r.callDate).toLocaleString() },
            { key: "customerName", header: "Customer", accessor: (r: any) => r.customerName },
            { key: "phone", header: "Phone", accessor: (r: any) => r.phone },
            { key: "callResult", header: "Result", accessor: (r: any) => r.callResult },
            { key: "agentName", header: "Agent", accessor: (r: any) => r.agentName ?? "—" },
            {
              key: "durationMinutes",
              header: "Duration (min)",
              accessor: (r: any) => r.durationMinutes ?? "—",
            },
          ]}
        />
      ) : (
        <div className="text-sm text-muted-foreground">No campaigns available.</div>
      )}
    </div>
  );
}

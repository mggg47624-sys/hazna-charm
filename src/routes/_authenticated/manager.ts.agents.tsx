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

export const Route = createFileRoute("/_authenticated/manager/ts/agents")({
  component: () => (
    <SectionGuard section="manager:ts">
      <Page />
    </SectionGuard>
  ),
});

function Page() {
  const campaigns = useActiveCampaigns();
  const [cid, setCid] = useState<number | undefined>(undefined);
  const activeCid = cid ?? campaigns.data?.[0]?.id;
  const [values, setValues] = useState<FilterValues>({});
  const predicate = useMemo(
    () => buildRowFilter<any>(values, {}, [(r: any) => r.agentName]),
    [values],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">TS Agents</h1>
          <p className="text-sm text-muted-foreground">
            Per-agent stats (read-only).
          </p>
        </div>
        <Select
          value={activeCid ? String(activeCid) : ""}
          onValueChange={(v) => setCid(Number(v))}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Campaign" />
          </SelectTrigger>
          <SelectContent>
            {campaigns.data?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {activeCid ? (
        <ReportTable
          queryKey={["manager", "ts", "agents", activeCid]}
          endpoint={`/api/ts/Report/AgentStats/${activeCid}`}
          filename={`ts-agents-campaign-${activeCid}`}
          searchPlaceholder="Search agents..."
          clientFilter={predicate}
          extraFilters={
            <FilterBar fields={["search"]} values={values} onChange={setValues} />
          }
          columns={[
            { key: "agentName", header: "Agent", accessor: (r: any) => r.agentName },
            { key: "totalCalls", header: "Calls", accessor: (r: any) => r.totalCalls },
            { key: "answeredCalls", header: "Answered", accessor: (r: any) => r.answeredCalls },
            { key: "conversions", header: "Conversions", accessor: (r: any) => r.conversions },
            {
              key: "avgCallMinutes",
              header: "Avg (min)",
              accessor: (r: any) => Number(r.avgCallMinutes ?? 0).toFixed(1),
            },
          ]}
        />
      ) : (
        <div className="text-sm text-muted-foreground">No campaigns available.</div>
      )}
    </div>
  );
}

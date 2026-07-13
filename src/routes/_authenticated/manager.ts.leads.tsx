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

export const Route = createFileRoute("/_authenticated/manager/ts/leads")({
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
    () =>
      buildRowFilter<any>(
        values,
        {
          mobile: (r) => r.phone,
          agent: (r) => r.assignedAgent,
        },
        [(r: any) => r.customerName, (r: any) => r.phone, (r: any) => r.companyName],
      ),
    [values],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">TS Leads</h1>
          <p className="text-sm text-muted-foreground">
            All leads for the selected campaign (read-only).
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
          queryKey={["manager", "ts", "leads", activeCid]}
          endpoint={`/api/ts/Report/Leads/${activeCid}`}
          filename={`ts-leads-campaign-${activeCid}`}
          searchPlaceholder="Search leads..."
          clientFilter={predicate}
          extraFilters={
            <FilterBar
              fields={["search", "mobile"]}
              values={values}
              onChange={setValues}
            />
          }
          columns={[
            { key: "customerName", header: "Customer", accessor: (r: any) => r.customerName },
            { key: "phone", header: "Phone", accessor: (r: any) => r.phone },
            { key: "companyName", header: "Company", accessor: (r: any) => r.companyName ?? "—" },
            { key: "city", header: "City", accessor: (r: any) => r.city ?? "—" },
            { key: "assignedAgent", header: "Agent", accessor: (r: any) => r.assignedAgent ?? "—" },
            { key: "status", header: "Status", accessor: (r: any) => r.status ?? "—" },
            { key: "isReferral", header: "Referral", accessor: (r: any) => (r.isReferral ? "Yes" : "—") },
          ]}
        />
      ) : (
        <div className="text-sm text-muted-foreground">No campaigns available.</div>
      )}
    </div>
  );
}

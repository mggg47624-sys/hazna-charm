import { createFileRoute } from "@tanstack/react-router";
import { ManagerReport } from "@/components/manager-report";

export const Route = createFileRoute("/_authenticated/manager/ts/campaigns")({
  component: () => (
    <ManagerReport
      section="manager:ts"
      title="Campaigns"
      subtitle="All TeleSales campaigns (read-only)"
      endpoint="/api/ts/Campaign"
      queryKey={["ts", "campaigns"]}
      filename="campaigns"
      filterFields={["search", "dateFrom", "dateTo"]}
      filterAccessors={{ dateFrom: (r: any) => r.startDate, dateTo: (r: any) => r.startDate }}
      searchKeys={[(r: any) => r.name, (r: any) => r.description]}
      columns={[
        { key: "name", header: "Name", accessor: (r: any) => r.name },
        { key: "description", header: "Description", accessor: (r: any) => r.description || "—" },
        { key: "startDate", header: "Starts", accessor: (r: any) => r.startDate || "—" },
        { key: "endDate", header: "Ends", accessor: (r: any) => r.endDate || "—" },
        { key: "isActive", header: "Active", accessor: (r: any) => (r.isActive ? "Yes" : "No") },
        { key: "leadsCount", header: "Leads", accessor: (r: any) => r.leadsCount ?? 0 },
        { key: "agentsCount", header: "Agents", accessor: (r: any) => r.agentsCount ?? 0 },
        { key: "progress", header: "Progress %", accessor: (r: any) => `${r.progress ?? 0}%` },
      ]}
    />
  ),
});

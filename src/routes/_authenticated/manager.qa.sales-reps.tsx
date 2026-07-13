import { createFileRoute } from "@tanstack/react-router";
import { ManagerReport } from "@/components/manager-report";

export const Route = createFileRoute("/_authenticated/manager/qa/sales-reps")({
  component: () => (
    <ManagerReport
      section="manager:qa"
      title="Sales Reps"
      subtitle="Sales rep performance (read-only)"
      endpoint="/api/Report/SalesReps"
      queryKey={["reports", "salesReps"]}
      filename="qa-sales-reps"
      filterFields={["search"]}
      searchKeys={[
        (r: any) => r.SalesRepName || r.salesRepName,
        (r: any) => r.KhaznaId || r.khaznaId,
        (r: any) => r.TeamLeaderName || r.teamLeaderName,
      ]}
      columns={[
        { key: "khaznaId", header: "Khazna ID", accessor: (r: any) => r.KhaznaId || r.khaznaId || "—" },
        { key: "salesRepName", header: "Sales Rep", accessor: (r: any) => r.SalesRepName || r.salesRepName || "—" },
        { key: "teamLeaderName", header: "Team Leader", accessor: (r: any) => r.TeamLeaderName || r.teamLeaderName || "—" },
        { key: "totalCalls", header: "Calls", accessor: (r: any) => r.TotalCalls ?? r.totalCalls ?? 0 },
        { key: "totalEvaluations", header: "Evaluations", accessor: (r: any) => r.TotalEvaluations ?? r.totalEvaluations ?? 0 },
        { key: "avgScore", header: "Avg Score", accessor: (r: any) => Number(r.AvgScore ?? r.avgScore ?? 0).toFixed(2) },
      ]}
    />
  ),
});

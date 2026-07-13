import { createFileRoute } from "@tanstack/react-router";
import { ManagerReport } from "@/components/manager-report";

export const Route = createFileRoute("/_authenticated/manager/qa/evaluations")({
  component: () => (
    <ManagerReport
      section="manager:qa"
      title="Evaluations"
      subtitle="All QA evaluations (read-only)"
      endpoint="/api/Report/Evaluations"
      queryKey={["reports", "evaluations"]}
      filename="qa-evaluations"
      filterFields={["search", "dateFrom", "dateTo"]}
      filterAccessors={{
        dateFrom: (r: any) => r.EvaluatedAt || r.evaluatedAt,
        dateTo: (r: any) => r.EvaluatedAt || r.evaluatedAt,
      }}
      searchKeys={[
        (r: any) => r.CustomerName || r.customerName,
        (r: any) => r.SalesRepName || r.salesRepName,
        (r: any) => r.AgentName || r.agentName,
      ]}
      columns={[
        {
          key: "evaluatedAt",
          header: "Date",
          accessor: (r: any) =>
            (r.EvaluatedAt || r.evaluatedAt || "").toString().slice(0, 16).replace("T", " ") || "—",
        },
        { key: "customerName", header: "Customer", accessor: (r: any) => r.CustomerName || r.customerName || "—" },
        { key: "salesRepName", header: "Sales Rep", accessor: (r: any) => r.SalesRepName || r.salesRepName || "—" },
        { key: "agentName", header: "QA Agent", accessor: (r: any) => r.AgentName || r.agentName || "—" },
        {
          key: "totalScore",
          header: "Score",
          accessor: (r: any) => Number(r.TotalScore ?? r.totalScore ?? 0).toFixed(2),
        },
      ]}
    />
  ),
});

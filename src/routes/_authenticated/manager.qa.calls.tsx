import { createFileRoute } from "@tanstack/react-router";
import { ManagerReport } from "@/components/manager-report";

export const Route = createFileRoute("/_authenticated/manager/qa/calls")({
  component: () => (
    <ManagerReport
      section="manager:qa"
      title="QA Calls"
      subtitle="All QA call attempts (read-only)"
      endpoint="/api/Report/Calls"
      queryKey={["reports", "calls"]}
      filename="qa-calls"
      filterFields={["search", "mobile", "dateFrom", "dateTo", "callResult", "operationType"]}
      filterAccessors={{
        dateFrom: (r: any) => r.calledAt || r.StartTime,
        dateTo: (r: any) => r.calledAt || r.StartTime,
        mobile: (r: any) => r.phone || r.Phone,
        callResult: (r: any) => r.callResult || r.CallResult,
        operationType: (r: any) => r.transactionType || r.TransactionType,
      }}
      searchKeys={[
        (r: any) => r.customerName || r.CustomerName,
        (r: any) => r.phone || r.Phone,
        (r: any) => r.agentName || r.AgentName,
        (r: any) => r.salesRepName || r.SalesRepName,
      ]}
      columns={[
        {
          key: "calledAt",
          header: "Date",
          accessor: (r: any) =>
            (r.calledAt || r.StartTime || "").toString().slice(0, 16).replace("T", " ") || "—",
        },
        { key: "customerName", header: "Customer", accessor: (r: any) => r.customerName || r.CustomerName || "—" },
        { key: "phone", header: "Phone", accessor: (r: any) => r.phone || r.Phone || "—" },
        { key: "salesRepName", header: "Sales Rep", accessor: (r: any) => r.salesRepName || r.SalesRepName || "—" },
        { key: "transactionType", header: "Operation", accessor: (r: any) => r.transactionType || r.TransactionType || "—" },
        { key: "agentName", header: "QA Agent", accessor: (r: any) => r.agentName || r.AgentName || "—" },
        { key: "callResult", header: "Result", accessor: (r: any) => r.callResult || r.CallResult || "—" },
      ]}
    />
  ),
});

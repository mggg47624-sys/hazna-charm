import { createFileRoute } from "@tanstack/react-router";
import { ManagerReport } from "@/components/manager-report";

export const Route = createFileRoute("/_authenticated/manager/qa/customers")({
  component: () => (
    <ManagerReport
      section="manager:qa"
      title="Customers"
      subtitle="All customers across batches (read-only)"
      endpoint="/api/Report/Customers"
      queryKey={["reports", "customers"]}
      filename="qa-customers"
      filterFields={["search", "mobile", "customerStatus", "operationType"]}
      filterAccessors={{
        mobile: (r: any) => r.Phone || r.phone,
        customerStatus: (r: any) => r.CustomerStatus || r.customerStatus,
        operationType: (r: any) => r.TransactionType || r.transactionType,
      }}
      searchKeys={[
        (r: any) => r.CustomerName || r.customerName,
        (r: any) => r.KhaznaId || r.khaznaId,
        (r: any) => r.CompanyName || r.companyName,
        (r: any) => r.SalesRepName || r.salesRepName,
      ]}
      columns={[
        { key: "khaznaId", header: "Khazna ID", accessor: (r: any) => r.KhaznaId || r.khaznaId || "—" },
        { key: "customerName", header: "Customer", accessor: (r: any) => r.CustomerName || r.customerName || "—" },
        { key: "phone", header: "Phone", accessor: (r: any) => r.Phone || r.phone || "—" },
        { key: "companyName", header: "Company", accessor: (r: any) => r.CompanyName || r.companyName || "—" },
        { key: "transactionType", header: "Operation", accessor: (r: any) => r.TransactionType || r.transactionType || "—" },
        { key: "customerStatus", header: "Status", accessor: (r: any) => r.CustomerStatus || r.customerStatus || "—" },
        { key: "salesRepName", header: "Sales Rep", accessor: (r: any) => r.SalesRepName || r.salesRepName || "—" },
        { key: "attemptCount", header: "Attempts", accessor: (r: any) => r.AttemptCount ?? r.attemptCount ?? 0 },
      ]}
    />
  ),
});

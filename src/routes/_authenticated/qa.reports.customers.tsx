import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ReportTable } from "@/components/report-table";
import { SectionGuard } from "@/components/section-guard";
import { useCustomerStatuses, useTransactionTypes } from "@/lib/lookups";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/qa/reports/customers")({
  component: CustomersReport,
});

function CustomersReport() {
  const statuses = useCustomerStatuses();
  const txTypes = useTransactionTypes();
  const [status, setStatus] = useState("all");
  const [tx, setTx] = useState("all");

  const clientFilter = useMemo(
    () => (r: any) => {
      if (status !== "all" && String(r.customerStatus ?? r.customerStatusId ?? "") !== status) return false;
      if (tx !== "all" && String(r.transactionType ?? r.transactionTypeId ?? "") !== tx) return false;
      return true;
    },
    [status, tx],
  );

  return (
    <SectionGuard section="qa:reports">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Customers Report</h1>
          <p className="text-sm text-muted-foreground">All imported customers across batches</p>
        </div>
        <ReportTable
          queryKey={["reports", "customers"]}
          endpoint="/api/Report/Customers"
          filename="customers.csv"
          searchPlaceholder="Search customers, phone, sales rep..."
          clientFilter={clientFilter}
          extraFilters={
            <>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statuses.data?.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.nameEn || s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tx} onValueChange={setTx}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Transaction" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All transactions</SelectItem>
                  {txTypes.data?.map((t) => (
                    <SelectItem key={t.id} value={t.name}>{t.nameEn || t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          columns={[
            { key: "khaznaId", header: "Khazna ID" },
            { key: "customerName", header: "Customer", accessor: (r: any) => r.customerName },
            { key: "phone", header: "Phone" },
            { key: "companyName", header: "Company" },
            { key: "transactionType", header: "Transaction" },
            { key: "customerStatus", header: "Status" },
            { key: "leadStatus", header: "Lead Status", accessor: (r: any) => r.leadStatus || "—" },
            { key: "salesRepName", header: "Sales Rep" },
            { key: "attemptCount", header: "Attempts" },
            { key: "date", header: "Date", accessor: (r: any) => (r.createdAt || "").toString().slice(0, 16).replace("T", " ") || "—" },
          ]}
        />
      </div>
    </SectionGuard>
  );
}


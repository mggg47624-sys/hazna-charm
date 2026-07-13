import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { useCanAccess } from "@/lib/auth";

interface Props {
  rows: any[] | undefined | null;
  filename?: string;
  /** Optional column mapping: `{ label: "Header", key: "row.field" }` — nested via dot notation. */
  columns?: Array<{ label: string; key: string; format?: (v: any) => string | number }>;
  disabled?: boolean;
}

function get(row: any, key: string): any {
  return key.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), row);
}

function normalize(
  rows: any[],
  columns?: Props["columns"],
): { headers: string[]; data: (string | number)[][] } {
  if (!rows.length) return { headers: [], data: [] };
  const first = rows[0] || {};
  const cols =
    columns ??
    Object.keys(first).map((k) => ({ label: k, key: k, format: undefined as any }));
  const headers = cols.map((c) => c.label);
  const data = rows.map((r) =>
    cols.map((c) => {
      const raw = get(r, c.key);
      if (raw == null) return "";
      if (c.format) return c.format(raw);
      if (raw instanceof Date) return raw.toISOString();
      if (typeof raw === "object") return JSON.stringify(raw);
      return raw as string | number;
    }),
  );
  return { headers, data };
}

function toCsv(headers: string[], data: (string | number)[][]): string {
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(escape).join(","), ...data.map((r) => r.map(escape).join(","))].join(
    "\n",
  );
}

/**
 * Export CSV / Excel button. Visible only to roles that have `exports`
 * permission (QA Admin, TS Admin, TS Team Leader, Manager).
 */
export function ExportButton({ rows, filename = "export", columns, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const canExport = useCanAccess("exports");
  const count = useMemo(() => (rows ? rows.length : 0), [rows]);

  if (!canExport) return null;

  const stamp = new Date().toISOString().slice(0, 10);
  const base = `${filename}-${stamp}`;

  const downloadCsv = () => {
    if (!rows || !rows.length) return toast.info("Nothing to export");
    setBusy(true);
    try {
      const { headers, data } = normalize(rows, columns);
      const csv = toCsv(headers, data);
      const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${count} rows`);
    } finally {
      setBusy(false);
    }
  };

  const downloadXlsx = () => {
    if (!rows || !rows.length) return toast.info("Nothing to export");
    setBusy(true);
    try {
      const { headers, data } = normalize(rows, columns);
      const aoa = [headers, ...data];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, `${base}.xlsx`);
      toast.success(`Exported ${count} rows`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || busy || !count}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadXlsx}>
          <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadCsv}>
          <FileText className="h-4 w-4 mr-2" /> CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

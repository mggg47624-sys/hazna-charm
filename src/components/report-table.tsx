import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2, Search } from "lucide-react";
import { api } from "@/lib/api";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  accessor?: (row: T) => string | number | null | undefined;
}

interface Props<T extends Record<string, any>> {
  queryKey: unknown[];
  endpoint: string;
  columns: Column<T>[];
  filename?: string;
  searchPlaceholder?: string;
  extraFilters?: React.ReactNode;
  emptyMessage?: string;
  /** Client-side row filter applied before the search box. */
  clientFilter?: (row: T) => boolean;
  /** Optional initial data fetched outside (skip own query). */
  initialData?: T[];
}

export function ReportTable<T extends Record<string, any>>({
  queryKey,
  endpoint,
  columns,
  filename = "report.csv",
  searchPlaceholder = "Search...",
  extraFilters,
  emptyMessage = "No data found",
  clientFilter,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => api<T[]>(endpoint),
  });

  const rows = useMemo(() => {
    let list = Array.isArray(data) ? data : [];
    if (clientFilter) list = list.filter(clientFilter);
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((r) =>
      columns.some((c) => {
        const v = c.accessor ? c.accessor(r) : r[c.key];
        return v != null && String(v).toLowerCase().includes(q);
      }),
    );
  }, [data, search, columns, clientFilter]);

  const exportCsv = () => {
    const header = columns.map((c) => `"${c.header}"`).join(",");
    const lines = rows.map((r) =>
      columns
        .map((c) => {
          const v = c.accessor ? c.accessor(r) : r[c.key];
          return `"${String(v ?? "").replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {extraFilters}
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key}>{c.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="h-5 w-5 animate-spin inline text-primary" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                  {(error as Error).message}
                </TableCell>
              </TableRow>
            ) : !rows.length ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.key}>
                      {c.render ? c.render(r) : (r[c.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        {rows.length} record{rows.length === 1 ? "" : "s"}
      </div>
    </Card>
  );
}

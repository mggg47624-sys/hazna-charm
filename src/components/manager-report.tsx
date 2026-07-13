/**
 * Thin read-only wrappers reusing `ReportTable` for Manager-scoped views.
 * Manager has no row actions — export + search + filters only.
 */
import { useMemo, useState } from "react";
import type { FilterKey, FilterValues } from "@/components/filters/filter-bar";
import { FilterBar, buildRowFilter } from "@/components/filters/filter-bar";
import { ReportTable, type Column } from "@/components/report-table";
import { SectionGuard } from "@/components/section-guard";
import type { Section } from "@/lib/permissions";

interface Props {
  section: Section;
  title: string;
  subtitle?: string;
  endpoint: string;
  queryKey: unknown[];
  columns: Column<any>[];
  filename: string;
  filterFields?: FilterKey[];
  /** Optional per-row accessors for filter fields. */
  filterAccessors?: Record<string, (r: any) => unknown>;
  /** Fallback search keys when general search is used. */
  searchKeys?: Array<(r: any) => unknown>;
}

export function ManagerReport({
  section,
  title,
  subtitle,
  endpoint,
  queryKey,
  columns,
  filename,
  filterFields = ["search", "dateFrom", "dateTo"],
  filterAccessors = {},
  searchKeys,
}: Props) {
  const [values, setValues] = useState<FilterValues>({});
  const predicate = useMemo(
    () => buildRowFilter<any>(values, filterAccessors as any, searchKeys),
    [values, filterAccessors, searchKeys],
  );

  return (
    <SectionGuard section={section}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <ReportTable
          queryKey={queryKey}
          endpoint={endpoint}
          columns={columns}
          filename={filename}
          searchPlaceholder="Quick filter across columns..."
          clientFilter={predicate}
          extraFilters={
            <FilterBar fields={filterFields} values={values} onChange={setValues} />
          }
        />
      </div>
    </SectionGuard>
  );
}

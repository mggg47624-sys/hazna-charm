import { createFileRoute } from "@tanstack/react-router";
import { SectionGuard } from "@/components/section-guard";
import { TsMonthlyReport } from "@/components/ts-monthly-reports";

export const Route = createFileRoute("/_authenticated/ts/reports/monthly/companies")({
  head: () => ({ meta: [
    { title: "Company Performance — Khazna Portal" },
    { name: "description", content: "Visualize monthly TeleSales lead and conversion results by company." },
    { property: "og:title", content: "Company Performance — Khazna Portal" },
    { property: "og:description", content: "Visualize monthly TeleSales lead and conversion results by company." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SectionGuard section="ts:performance-report"><TsMonthlyReport kind="companies" /></SectionGuard>,
});
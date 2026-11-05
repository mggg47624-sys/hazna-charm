import { createFileRoute } from "@tanstack/react-router";
import { SectionGuard } from "@/components/section-guard";
import { TsMonthlyReport } from "@/components/ts-monthly-reports";

export const Route = createFileRoute("/_authenticated/ts/reports/monthly")({
  head: () => ({ meta: [
    { title: "TeleSales Monthly Overview — Khazna Portal" },
    { name: "description", content: "Monthly TeleSales calls, conversions, campaign results, and agent performance." },
    { property: "og:title", content: "TeleSales Monthly Overview — Khazna Portal" },
    { property: "og:description", content: "Monthly TeleSales calls, conversions, campaign results, and agent performance." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SectionGuard section="ts:performance-report"><TsMonthlyReport kind="overview" /></SectionGuard>,
});
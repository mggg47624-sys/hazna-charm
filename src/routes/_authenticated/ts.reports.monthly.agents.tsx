import { createFileRoute } from "@tanstack/react-router";
import { SectionGuard } from "@/components/section-guard";
import { TsMonthlyReport } from "@/components/ts-monthly-reports";

export const Route = createFileRoute("/_authenticated/ts/reports/monthly/agents")({
  head: () => ({ meta: [
    { title: "Agent Performance — Khazna Portal" },
    { name: "description", content: "Review monthly TeleSales agent calls, conversions, and target achievement." },
    { property: "og:title", content: "Agent Performance — Khazna Portal" },
    { property: "og:description", content: "Review monthly TeleSales agent calls, conversions, and target achievement." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <SectionGuard section="ts:performance-report"><TsMonthlyReport kind="agents" /></SectionGuard>,
});